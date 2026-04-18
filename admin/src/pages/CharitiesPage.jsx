import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [form, setForm] = useState({ name: '', description: '', image_url: '', featured: false })
  const [editingId, setEditingId] = useState(null)
  
  const [reports, setReports] = useState([])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/charities'),
      api.get('/admin/reports/charity').catch(() => ({ data: { charityTotals: [] } }))
    ])
    .then(([cRes, rRes]) => {
      setCharities(cRes.data.charities || [])
      setReports(rRes.data.charityTotals || [])
    })
    .catch((err) => alert('Failed to load data: ' + err.message))
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (charity) => {
    setEditingId(charity.id)
    setForm({
      name: charity.name,
      description: charity.description || '',
      image_url: charity.image_url || '',
      featured: charity.featured
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm({ name: '', description: '', image_url: '', featured: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/charities/${editingId}`, form)
      } else {
        await api.post('/charities', form)
      }
      handleCancel()
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save charity')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting a charity will nullify user selections for this charity. Proceed?')) return
    try {
      await api.delete(`/charities/${id}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  // Helper to find report total
  const getReportTotal = (charityName) => {
    const rep = reports.find(r => r.name === charityName)
    return rep ? rep.total : 0
  }

  return (
    <div>
      <div className="flex-between mb-lg">
        <h2>Charities Management</h2>
        <button className="btn btn-outline btn-sm" onClick={fetchData}>Refresh</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="mb-md">Charity Directory</h3>
          {loading ? (
            <div className="spinner" />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Featured</th>
                    <th>Monthly Contributions (£)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.map(c => (
                    <tr key={c.id}>
                      <td className="font-bold">{c.name}</td>
                      <td>
                        {c.featured && <span className="badge badge-primary">Yes</span>}
                      </td>
                      <td className="text-success font-bold">
                        £{getReportTotal(c.name).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td>
                        <div className="flex gap-sm">
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{alignSelf: 'flex-start'}}>
          <h3 className="mb-md">{editingId ? 'Edit Charity' : 'Add New Charity'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows="4" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL (Optional)</label>
              <input type="url" className="form-input" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group flex align-center gap-sm">
              <input type="checkbox" id="featuredCheck" checked={form.featured} onChange={e=>setForm({...form, featured: e.target.checked})} />
              <label htmlFor="featuredCheck">Feature on Homepage</label>
            </div>
            <div className="flex gap-sm mt-md">
              <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add Charity'}</button>
              {editingId && <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
