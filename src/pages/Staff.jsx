import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Users, ShieldCheck, Plus, Edit, Trash2, 
  Lock, UserPlus, Shield, X, Check, Search, Key
} from 'lucide-react'
import { createPortal } from 'react-dom'

const Modal = ({ children, onClose, title }) => {
  return createPortal(
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999999 
    }}>
      <div className="glass-card" style={{ 
        padding: '50px', width: '95%', maxWidth: '800px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--primary)', border: '1px solid var(--cta)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white' }}>
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  )
}

const Staff = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)

  const [showUserModal, setShowUserModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'staff', group_ids: [], phone: '' })
  const [groupForm, setGroupForm] = useState({ name: '', permission_ids: [] })

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchData(1)
  }, [])

  const fetchData = async (p = 1) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const [uRes, gRes, pRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/users/?page=${p}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/groups/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/permissions/', { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      const usersData = uRes.data.results || uRes.data
      setUsers(usersData)
      setHasMore(!!uRes.data.next)
      setPage(1)

      const groupsData = gRes.data.results || gRes.data
      const permsData = pRes.data.results || pRes.data

      setGroups(groupsData)
      const relevantModels = ['product', 'rental', 'sale', 'category', 'customer', 'payment', 'user', 'group', 'notification']
      const filteredPerms = permsData.filter(p => 
        relevantModels.some(model => p.codename.endsWith(model))
      )
      setPermissions(filteredPerms)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const fetchMoreUsers = async () => {
    setLoadingMore(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/users/?page=${page + 1}`, { headers: { Authorization: `Bearer ${token}` } })
      setUsers(prev => [...prev, ...(res.data.results || [])])
      setHasMore(!!res.data.next)
      setPage(prev => prev + 1)
    } catch (err) {}
    setLoadingMore(false)
  }

  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingItem(user)
      setUserForm({
        username: user.username,
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.role,
        group_ids: (user.groups_data || []).map(g => g.id),
        phone: user.phone || ''
      })
    } else {
      setEditingItem(null)
      setUserForm({ username: '', email: '', password: '', confirmPassword: '', role: 'staff', group_ids: [], phone: '' })
    }
    setShowUserModal(true)
  }

  const handleOpenGroupModal = (group = null) => {
    if (group) {
      setEditingItem(group)
      setGroupForm({
        name: group.name,
        permission_ids: (group.permissions || []).map(p => p.id)
      })
    } else {
      setEditingItem(null)
      setGroupForm({ name: '', permission_ids: [] })
    }
    setShowGroupModal(true)
  }

  const submitUser = async (e) => {
    e.preventDefault()
    if (userForm.password !== userForm.confirmPassword) {
      alert("Las contraseñas no coinciden.")
      return
    }
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const payload = { ...userForm }
      delete payload.confirmPassword
      
      if (editingItem) {
        if (!payload.password) delete payload.password
        await axios.patch(`http://127.0.0.1:8000/api/users/${editingItem.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post('http://127.0.0.1:8000/api/users/', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowUserModal(false)
      fetchData()
    } catch (err) { alert("Error al guardar usuario") }
    setLoading(false)
  }

  const submitGroup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      if (editingItem) {
        await axios.patch(`http://127.0.0.1:8000/api/groups/${editingItem.id}/`, groupForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post('http://127.0.0.1:8000/api/groups/', groupForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowGroupModal(false)
      fetchData()
    } catch (err) { alert("Error al guardar grupo") }
    setLoading(false)
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (err) { alert("Error al eliminar usuario") }
  }

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("¿Eliminar este rol? Esto afectará a los usuarios asignados.")) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://127.0.0.1:8000/api/groups/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (err) { alert("Error al eliminar rol") }
  }

  const translatePermission = (name) => {
    const translations = {
      'Can add product': 'Crear Productos',
      'Can change product': 'Editar Productos',
      'Can delete product': 'Eliminar Productos',
      'Can view product': 'Ver Inventario',
      'Can add rental': 'Crear Alquileres',
      'Can change rental': 'Gestionar Alquileres',
      'Can delete rental': 'Eliminar Alquileres',
      'Can view rental': 'Ver Historial Alquileres',
      'Can add sale': 'Procesar Ventas',
      'Can change sale': 'Editar Ventas',
      'Can delete sale': 'Anular Ventas',
      'Can view sale': 'Ver Historial Ventas',
      'Can add category': 'Crear Categorías',
      'Can view category': 'Ver Categorías',
      'Can add customer': 'Registrar Clientes',
      'Can view customer': 'Ver Clientes',
      'Can add payment': 'Registrar Pagos',
      'Can view payment': 'Ver Movimientos',
      'Can add user': 'Crear Personal',
      'Can view user': 'Ver Personal',
      'Can add group': 'Crear Roles',
      'Can view group': 'Ver Roles',
      'Can add notification': 'Crear Alertas',
      'Can view notification': 'Ver Alertas',
    }
    return translations[name] || name
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>PERSONAL Y ROLES</h1>
          <p style={{ color: 'var(--text-dim)' }}>Gestión de accesos y permisos del equipo</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => handleOpenGroupModal()} className="btn-outline">
            <Shield size={18} /> NUEVO ROL
          </button>
          <button onClick={() => handleOpenUserModal()} className="btn-primary">
            <UserPlus size={18} /> NUEVO USUARIO
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setActiveTab('users')} style={{ border: 'none', background: 'transparent', color: activeTab === 'users' ? 'var(--cta)' : 'var(--text-dim)', padding: '15px', cursor: 'pointer', borderBottom: activeTab === 'users' ? '2px solid var(--cta)' : 'none' }} className="urban-font">USUARIOS</button>
        <button onClick={() => setActiveTab('groups')} style={{ border: 'none', background: 'transparent', color: activeTab === 'groups' ? 'var(--cta)' : 'var(--text-dim)', padding: '15px', cursor: 'pointer', borderBottom: activeTab === 'groups' ? '2px solid var(--cta)' : 'none' }} className="urban-font">ROLES Y PERMISOS</button>
      </div>

      {activeTab === 'users' ? (
        <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
          <table className="urban-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>ROL</th>
                <th>GRUPOS</th>
                <th>CONTACTO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cta)', fontWeight: 'bold' }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{u.username}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '6px', background: u.role === 'admin' ? 'rgba(184, 158, 72, 0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--cta)' : 'white', fontWeight: 'bold' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {(u.groups_data || []).map(g => (
                        <span key={g.id} style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{u.phone || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenUserModal(u)} className="btn-icon"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={fetchMoreUsers} className="btn-outline" disabled={loadingMore}>
                {loadingMore ? 'CARGANDO...' : 'CARGAR MÁS PERSONAL'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {groups.map(g => (
            <div key={g.id} className="glass-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--secondary)', padding: '10px', borderRadius: '8px' }}>
                    <Shield size={24} color="var(--cta)" />
                  </div>
                  <h3 className="urban-font" style={{ fontSize: '1.2rem' }}>{g.name.toUpperCase()}</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleOpenGroupModal(g)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Edit size={16} /></button>
                  <button onClick={() => handleDeleteGroup(g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '15px', textTransform: 'uppercase' }}>Permisos Asignados:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {g.permissions.map(p => (
                  <span key={p.id} style={{ fontSize: '0.6rem', padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                    {translatePermission(p.name)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <Modal onClose={() => setShowUserModal(false)} title={editingItem ? 'EDITAR PERSONAL' : 'REGISTRAR PERSONAL'}>
          <form onSubmit={submitUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Usuario</label>
                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Contraseña {editingItem && '(Opcional)'}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!editingItem} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Confirmar Contraseña</label>
                <input type="password" value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} required={!editingItem || userForm.password} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Rol Principal</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} style={{ width: '100%' }}>
                  <option value="staff">Personal Operativo</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>Asignar a Grupos (Roles Detallados)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {groups.map(g => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: userForm.group_ids.includes(g.id) ? 'rgba(184, 158, 72, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: userForm.group_ids.includes(g.id) ? 'var(--cta)' : 'rgba(255,255,255,0.05)' }}>
                      <input 
                        type="checkbox" 
                        checked={userForm.group_ids.includes(g.id)} 
                        onChange={() => {
                          const newIds = userForm.group_ids.includes(g.id) 
                            ? userForm.group_ids.filter(id => id !== g.id)
                            : [...userForm.group_ids, g.id]
                          setUserForm({...userForm, group_ids: newIds})
                        }}
                      />
                      <span style={{ fontSize: '0.8rem' }}>{g.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {loading ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </form>
        </Modal>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <Modal onClose={() => setShowGroupModal(false)} title={editingItem ? 'EDITAR ROL' : 'NUEVO ROL DE ACCESO'}>
          <form onSubmit={submitGroup}>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre del Rol</label>
              <input type="text" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} required placeholder="Ej: Cajero, Gestor de Inventario" style={{ width: '100%' }} />
            </div>
            
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>Permisos del Rol</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {permissions.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.75rem', padding: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={groupForm.permission_ids.includes(p.id)}
                    onChange={() => {
                      const newIds = groupForm.permission_ids.includes(p.id)
                        ? groupForm.permission_ids.filter(id => id !== p.id)
                        : [...groupForm.permission_ids, p.id]
                      setGroupForm({...groupForm, permission_ids: newIds})
                    }}
                  />
                  <span>{translatePermission(p.name)}</span>
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {loading ? 'GUARDANDO...' : 'GUARDAR ROL'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Staff
