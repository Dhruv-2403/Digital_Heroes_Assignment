import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />
  if (!stats) return <div className="text-danger">Failed to load stats.</div>

  return (
    <div>
      <h2 className="mb-lg">Dashboard Overview</h2>
      
      <div className="grid-4 mb-xl">
        <div className="card">
          <div className="text-muted text-sm text-uppercase">Total Users</div>
          <div className="font-heading text-primary" style={{fontSize: '2rem', fontWeight: 800}}>
            {stats.totalUsers || 0}
          </div>
        </div>
        <div className="card">
          <div className="text-muted text-sm text-uppercase">Active Subscribers</div>
          <div className="font-heading text-success" style={{fontSize: '2rem', fontWeight: 800}}>
            {stats.activeSubscribers || 0}
          </div>
        </div>
        <div className="card">
          <div className="text-muted text-sm text-uppercase">Prize Money Paid</div>
          <div className="font-heading text-gold" style={{fontSize: '2rem', fontWeight: 800}}>
            £{stats.totalPrizePaid?.toLocaleString() || 0}
          </div>
        </div>
        <div className="card">
          <div className="text-muted text-sm text-uppercase">Pending Payouts</div>
          <div className="font-heading text-warning" style={{fontSize: '2rem', fontWeight: 800}}>
            £{stats.totalPrizePending?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="mb-md">Recent Draws</h3>
          {stats.recentDraws?.length === 0 ? (
            <p className="text-muted text-sm">No draws found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Jackpot</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDraws?.map(draw => (
                    <tr key={draw.id}>
                      <td className="text-sm font-mono">{draw.id.substring(0,8)}...</td>
                      <td>
                        <span className={`badge badge-${draw.status === 'published' ? 'success' : draw.status === 'simulated' ? 'warning' : 'primary'}`}>
                          {draw.status}
                        </span>
                      </td>
                      <td className="text-gold font-bold">
                        £{(draw.prize_pools?.[0]?.jackpot_pool || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
