import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function WinnersPage() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWinners = () => {
    setLoading(true)
    api.get('/winners')
      .then(({ data }) => setWinners(data.winners || []))
      .catch((err) => alert('Failed to load winners: ' + err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWinners()
  }, [])

  const handleVerify = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this proof?`)) return
    try {
      await api.patch(`/winners/${id}/verify`, { action })
      fetchWinners()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update verification status')
    }
  }

  const handlePay = async (id) => {
    if (!window.confirm('Mark this winner as PAID?')) return
    try {
      await api.patch(`/winners/${id}/pay`)
      fetchWinners()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark as paid')
    }
  }

  return (
    <div>
      <div className="flex-between mb-lg">
        <h2>Winners & Payouts</h2>
        <button className="btn btn-outline btn-sm" onClick={fetchWinners}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Draw</th>
                  <th>User</th>
                  <th>Match</th>
                  <th>Prize</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {winners.map(w => (
                  <tr key={w.id}>
                    <td className="font-bold">{w.draws?.month}</td>
                    <td>
                      <div>{w.users?.name}</div>
                      <div className="text-xs text-muted">{w.users?.email}</div>
                    </td>
                    <td><span className="badge badge-primary">{w.match_type}</span></td>
                    <td className="text-gold font-bold">£{w.prize_amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    
                    {/* Verification Column */}
                    <td>
                      {!w.proof_url ? (
                        <span className="text-muted text-sm italic">Not submitted</span>
                      ) : (
                        <div className="flex flex-col gap-sm">
                          <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">View Proof</a>
                          {w.verification_status === 'approved' ? (
                            <span className="text-success text-xs font-bold">APPROVED</span>
                          ) : w.verification_status === 'rejected' ? (
                            <span className="text-danger text-xs font-bold">REJECTED</span>
                          ) : (
                            <div className="flex gap-sm mt-sm">
                              <button className="btn btn-sm" style={{background: 'var(--color-success)', color: 'white'}} onClick={() => handleVerify(w.id, 'approve')}>✓</button>
                              <button className="btn btn-sm" style={{background: 'var(--color-danger)', color: 'white'}} onClick={() => handleVerify(w.id, 'reject')}>✗</button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Column */}
                    <td>
                      <span className={`badge badge-${w.status === 'paid' ? 'success' : 'warning'}`}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td>
                      {w.status !== 'paid' && w.verification_status === 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handlePay(w.id)}>
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
