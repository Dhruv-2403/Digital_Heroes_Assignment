import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    setLoading(true)
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch((err) => alert('Failed to load users: ' + err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div>
      <div className="flex-between mb-lg">
        <h2>Users Management</h2>
        <button className="btn btn-primary btn-sm" onClick={fetchUsers}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Sub Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const sub = user.subscriptions?.[0]
                  return (
                    <tr key={user.id}>
                      <td className="font-medium">{user.name}</td>
                      <td className="text-muted text-sm">{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'warning'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {sub ? (
                          <span className={`badge badge-${sub.status === 'active' ? 'success' : 'danger'}`}>
                            {sub.status}
                          </span>
                        ) : (
                          <span className="badge" style={{background: 'rgba(255,255,255,0.1)', color: '#fff'}}>None</span>
                        )}
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
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
