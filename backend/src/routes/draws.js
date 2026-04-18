const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const POOL_SPLIT = { five: 0.40, four: 0.35, three: 0.25 };

const POOL_CONTRIBUTION_MONTHLY = 5; // £5 per subscriber goes to prize pool

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('draws')
    .select('*, prize_pools(*)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ draws: data });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('draws')
    .select('*, prize_pools(*), winners(*)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Draw not found' });
  res.json({ draw: data });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { month, draw_type } = req.body; // draw_type: 'random' | 'algorithmic'

    const { data: existing } = await supabase
      .from('draws')
      .select('id')
      .eq('month', month)
      .single();
    if (existing) return res.status(409).json({ error: 'A draw already exists for this month' });

    const { data, error } = await supabase
      .from('draws')
      .insert({ month, draw_type: draw_type || 'random', status: 'draft' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ draw: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/simulate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: draw } = await supabase.from('draws').select('*').eq('id', id).single();
    if (!draw) return res.status(404).json({ error: 'Draw not found' });

    const { data: subscribers } = await supabase
      .from('users')
      .select('id, scores(score, date)')
      .eq('role', 'subscriber')
      .not('scores', 'is', null);

    const eligible = subscribers.filter(u => u.scores && u.scores.length > 0);

    let drawNumbers;
    if (draw.draw_type === 'algorithmic') {
      drawNumbers = generateAlgorithmicNumbers(eligible);
    } else {
      drawNumbers = generateRandomNumbers();
    }

    const activeCount = eligible.length;
    const { data: rolledJackpot } = await supabase
      .from('draws')
      .select('prize_pools(jackpot_pool)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1);

    const basePool = activeCount * POOL_CONTRIBUTION_MONTHLY;
    const prevRolledJackpot = rolledJackpot?.[0]?.prize_pools?.[0]?.jackpot_pool || 0;

    const tiers = {
      jackpot_pool: basePool * POOL_SPLIT.five + prevRolledJackpot,
      four_match_pool: basePool * POOL_SPLIT.four,
      three_match_pool: basePool * POOL_SPLIT.three,
    };

    const winners = [];
    for (const user of eligible) {
      const userNumbers = user.scores
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(s => s.score);

      const matches = countMatches(userNumbers, drawNumbers);

      if (matches >= 3) {
        winners.push({
          user_id: user.id,
          match_count: matches,
          match_type: matches === 5 ? '5-match' : matches === 4 ? '4-match' : '3-match',
        });
      }
    }

    const { data: updatedDraw, error: updateError } = await supabase
      .from('draws')
      .update({ draw_numbers: drawNumbers, status: 'simulated', simulated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      draw: updatedDraw,
      drawNumbers,
      eligibleSubscribers: activeCount,
      prizePools: tiers,
      potentialWinners: winners,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: draw } = await supabase.from('draws').select('*').eq('id', id).single();
    if (!draw) return res.status(404).json({ error: 'Draw not found' });
    if (draw.status === 'published') return res.status(400).json({ error: 'Draw already published' });
    if (!draw.draw_numbers) return res.status(400).json({ error: 'Run simulation first' });

    const { data: subscribers } = await supabase
      .from('users')
      .select('id, scores(score, date)')
      .eq('role', 'subscriber');

    const eligible = subscribers.filter(u => u.scores && u.scores.length > 0);

    const activeCount = eligible.length;
    const basePool = activeCount * POOL_CONTRIBUTION_MONTHLY;

    const { data: prevUnwon } = await supabase
      .from('prize_pools')
      .select('jackpot_pool, jackpot_rolled')
      .eq('jackpot_rolled', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const rolledAmount = prevUnwon?.[0]?.jackpot_pool || 0;

    const jackpotPool = basePool * POOL_SPLIT.five + rolledAmount;
    const fourPool    = basePool * POOL_SPLIT.four;
    const threePool   = basePool * POOL_SPLIT.three;

    const { data: pool, error: poolError } = await supabase
      .from('prize_pools')
      .insert({
        draw_id: id,
        total_pool: basePool,
        jackpot_pool: jackpotPool,
        four_match_pool: fourPool,
        three_match_pool: threePool,
        rolled_jackpot: rolledAmount,
      })
      .select()
      .single();

    if (poolError) throw poolError;

    const winnersByTier = { '5-match': [], '4-match': [], '3-match': [] };

    for (const user of eligible) {
      const userNumbers = user.scores
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(s => s.score);

      const matches = countMatches(userNumbers, draw.draw_numbers);
      if (matches >= 3) {
        const matchType = matches === 5 ? '5-match' : matches === 4 ? '4-match' : '3-match';
        winnersByTier[matchType].push(user.id);
      }
    }

    const winnerInserts = [];
    const buildWinners = (pool, type, userIds) => {
      if (userIds.length === 0) return;
      const prizePerWinner = pool / userIds.length;
      userIds.forEach(uid => {
        winnerInserts.push({
          draw_id: id,
          user_id: uid,
          match_type: type,
          prize_amount: prizePerWinner,
          status: 'pending',
        });
      });
    };

    buildWinners(jackpotPool, '5-match', winnersByTier['5-match']);
    buildWinners(fourPool, '4-match', winnersByTier['4-match']);
    buildWinners(threePool, '3-match', winnersByTier['3-match']);

    if (winnerInserts.length > 0) {
      await supabase.from('winners').insert(winnerInserts);
    }

    const jackpotRolled = winnersByTier['5-match'].length === 0;
    if (jackpotRolled) {
      await supabase
        .from('prize_pools')
        .update({ jackpot_rolled: true })
        .eq('id', pool.id);
    }

    const { data: updatedDraw } = await supabase
      .from('draws')
      .update({ status: 'published', published_at: new Date().toISOString(), jackpot_rolled: jackpotRolled })
      .eq('id', id)
      .select()
      .single();

    res.json({
      draw: updatedDraw,
      pool,
      winnersCount: winnerInserts.length,
      jackpotRolled,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateRandomNumbers() {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1); // 1-45
  }
  return Array.from(numbers);
}

function generateAlgorithmicNumbers(subscribers) {

  const frequency = {};
  for (const user of subscribers) {
    for (const s of user.scores) {
      frequency[s.score] = (frequency[s.score] || 0) + 1;
    }
  }

  const scoreList = Object.entries(frequency).map(([score, count]) => ({
    score: parseInt(score),
    weight: 1 / count, // inverse frequency
  }));

  const selected = new Set();
  while (selected.size < 5 && scoreList.length > 0) {
    const totalWeight = scoreList.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of scoreList) {
      rand -= item.weight;
      if (rand <= 0) {
        selected.add(item.score);
        break;
      }
    }
  }

  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(selected);
}

function countMatches(userNumbers, drawNumbers) {
  return userNumbers.filter(n => drawNumbers.includes(n)).length;
}

module.exports = router;
