import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function DrawsPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMonth, setNewMonth] = useState('')
  const [creating, setCreating] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const fetchDraws = () => {
    setLoading(true)
    api.get('/draws')
      .then(({ data }) => setDraws(data.draws || []))
      .catch((err) => alert('Failed to load draws: ' + err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {

    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    setNewMonth(date.toISOString().slice(0, 7))
    fetchDraws()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/draws', { month: newMonth, draw_type: 'random' })
      fetchDraws()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create draw')
    } finally {
      setCreating(false)
    }
  }

  const handleSimulate = async (id) => {
    setProcessingId(id)
    try {
      await api.post(`/draws/${id}/simulate`)
      fetchDraws()
      alert('Simulation ran successfully! Check the updated prize pools before publishing.')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to simulate draw')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePublish = async (id) => {
    if (!window.confirm('Are you sure? This will lock the draw and assign winners. This cannot be undone.')) return
    
    setProcessingId(id)
    try {
      await api.post(`/draws/${id}/publish`)
      fetchDraws()
      alert('Draw published successfully!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish draw')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <div className="flex-between mb-lg">
        <h2>Draws Engine</h2>
        <button className="btn btn-outline btn-sm" onClick={fetchDraws}>Refresh</button>
      </div>

      <div className="card mb-xl">
        <h3 className="mb-md">Create New Draw</h3>
        <form onSubmit={handleCreate} className="flex gap-md" style={{alignItems: 'flex-end'}}>
          <div>
            <label className="form-label">Month (YYYY-MM)</label>
            <input type="month" className="form-input" value={newMonth} onChange={e=>setNewMonth(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating...' : '+ Create Draw Draft'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-md">Draws List</h3>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Numbers</th>
                  <th>Jackpot Pool (£)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {draws.map(draw => {
                  const pool = draw.prize_pools?.[0]
                  const isProcessing = processingId === draw.id
                  
                  return (
                    <tr key={draw.id}>
                      <td className="font-bold">{draw.month}</td>
                      <td>{draw.draw_type}</td>
                      <td>
                        <span className={`badge badge-${draw.status === 'published' ? 'success' : draw.status === 'simulated' ? 'warning' : 'primary'}`}>
                          {draw.status}
                        </span>
                      </td>
                      <td className="font-mono text-sm">
                        {draw.draw_numbers ? draw.draw_numbers.join(', ') : '-'}
                      </td>
                      <td className="text-gold font-bold">
                        {pool ? pool.jackpot_pool.toLocaleString() : '-'}
                      </td>
                      <td>
                        <div className="flex gap-sm">
                          {(draw.status === 'draft' || draw.status === 'simulated') && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              onClick={() => handleSimulate(draw.id)}
                              disabled={isProcessing}
                            >
                              Run Simulation
                            </button>
                          )}
                          {draw.status === 'simulated' && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePublish(draw.id)}
                              disabled={isProcessing}
                            >
                              Publish Winners
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
