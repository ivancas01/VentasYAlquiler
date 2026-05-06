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
      <div className="glass-card modal-content-card" style={{ 
        width: '95%', maxWidth: '800px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--primary)', border: '1px solid var(--cta)',
        position: 'relative', padding: '30px'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white' }}>
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.4rem', marginBottom: '25px' }}>{title}</h3>
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
      // Use a more inclusive approach: show everything except core Django internals
      const excludedModels = ['logentry', 'contenttype', 'session', 'permission']
      const filteredPerms = permsData.filter(p => {
        const parts = p.codename.split('_')
        const model = parts[1]
        return !excludedModels.includes(model)
      })
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
        phone: user.phone || '',
        full_name: user.full_name || '',
        document_number: user.document_number || ''
      })
    } else {
      setEditingItem(null)
      setUserForm({ username: '', email: '', password: '', confirmPassword: '', role: 'staff', group_ids: [], phone: '', full_name: '', document_number: '' })
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
    const actionMap = { 'add': 'Crear', 'change': 'Editar', 'delete': 'Eliminar', 'view': 'Ver' }
    const modelMap = {
      'product': 'Productos',
      'rental': 'Alquileres',
      'sale': 'Ventas',
      'category': 'Categorías',
      'customer': 'Clientes',
      'payment': 'Pagos',
      'user': 'Personal',
      'group': 'Roles',
      'notification': 'Alertas',
      'siteconfig': 'Sitio Web',
      'movement': 'Caja',
      'heroimage': 'Banner',
      'invoice': 'Facturas',
      'rentalitem': 'Items Alquiler',
      'saleitem': 'Items Venta'
    }

    // Try to find action and model from name "Can [action] [model]"
    const parts = name.toLowerCase().split(' ')
    if (parts[0] === 'can' && parts.length >= 3) {
      const action = actionMap[parts[1]] || parts[1]
      const modelKey = parts.slice(2).join('').replace(/\s/g, '')
      const model = modelMap[modelKey] || modelKey
      return `${action} ${model}`
    }
    return name
  }

  // Group permissions by model for the UI
  const groupedPermissions = permissions.reduce((acc, p) => {
    const parts = p.codename.split('_')
    const model = parts[1]
    if (!acc[model]) acc[model] = []
    acc[model].push(p)
    return acc
  }, {})

  const modelNames = {
    'product': 'INVENTARIO Y PRODUCTOS',
    'rental': 'ALQUILERES (HISTORIAL Y GESTIÓN)',
    'sale': 'VENTAS Y REPORTES',
    'category': 'CATEGORÍAS DE PRODUCTO',
    'customer': 'BASE DE DATOS DE CLIENTES',
    'payment': 'PAGOS Y ABONOS',
    'user': 'PERSONAL Y SEGURIDAD',
    'group': 'GESTIÓN DE ROLES',
    'notification': 'ALERTAS DEL SISTEMA',
    'siteconfig': 'CONTENIDO WEB (CMS)',
    'movement': 'CAJA Y MOVIMIENTOS',
    'heroimage': 'IMÁGENES DEL BANNER',
    'invoice': 'FACTURACIÓN Y RECIBOS',
    'rentalitem': 'DETALLES DE ALQUILER',
    'saleitem': 'DETALLES DE VENTA'
  }

  return (
    <div className="fade-in">
      <div className="admin-header">
        <div>
          <h1 className="urban-font gold-text admin-title">PERSONAL Y ROLES</h1>
          <p style={{ color: 'var(--text-dim)' }}>Gestión de accesos y permisos del equipo</p>
        </div>
        <div className="admin-actions">
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
          {groups.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Shield size={48} color="var(--text-dim)" style={{ marginBottom: '20px', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-dim)' }}>No hay roles personalizados creados todavía.</p>
              <button onClick={() => handleOpenGroupModal()} className="btn-outline" style={{ marginTop: '20px' }}>CREAR PRIMER ROL</button>
            </div>
          ) : (
            groups.map(g => (
            <div key={g.id} className="glass-card" style={{ padding: '30px', border: '1px solid var(--glass-border)', transition: 'transform 0.3s ease', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: 0 }}>
                  <div style={{ background: 'linear-gradient(135deg, var(--secondary), rgba(184, 158, 72, 0.1))', padding: '12px', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(184, 158, 72, 0.2)' }}>
                    <Shield size={22} color="var(--cta)" />
                  </div>
                  <h3 className="urban-font" style={{ fontSize: '1.1rem', margin: 0, wordBreak: 'break-word', lineHeight: '1.2', color: 'white' }}>
                    {g.name.toUpperCase()}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => handleOpenGroupModal(g)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar Rol">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDeleteGroup(g.id)} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar Rol">
                    <Trash2 size={14} />
                  </button>
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
            ))
          )}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <Modal onClose={() => setShowUserModal(false)} title={editingItem ? 'EDITAR PERSONAL' : 'REGISTRAR PERSONAL'}>
          <form onSubmit={submitUser}>
            <div className="cms-layout-stack">
              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Completo</label>
                  <input type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} required placeholder="Ej: Juan Pérez" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Usuario</label>
                  <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Número de Documento</label>
                  <input type="text" value={userForm.document_number} onChange={e => setUserForm({...userForm, document_number: e.target.value})} required placeholder="DNI / CC / Pasaporte" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono</label>
                  <input type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>
              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Contraseña {editingItem && '(Opcional)'}</label>
                  <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!editingItem} style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Confirmar Contraseña</label>
                  <input type="password" value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} required={!editingItem || userForm.password} style={{ width: '100%' }} />
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>Seleccionar Rol de Acceso</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {groups.map(g => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', background: userForm.group_ids.includes(g.id) ? 'rgba(184, 158, 72, 0.1)' : 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '10px', border: '1px solid', borderColor: userForm.group_ids.includes(g.id) ? 'var(--cta)' : 'rgba(255,255,255,0.05)', transition: 'all 0.2s ease' }}>
                      <input 
                        type="radio" 
                        name="userRole"
                        checked={userForm.group_ids.includes(g.id)} 
                        onChange={() => {
                          setUserForm({
                            ...userForm, 
                            group_ids: [g.id],
                            role: g.name.toLowerCase().includes('admin') ? 'admin' : 'staff'
                          })
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: userForm.group_ids.includes(g.id) ? 'white' : 'var(--text-dim)' }}>{g.name.toUpperCase()}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{g.name.toLowerCase().includes('admin') ? 'Acceso Administrativo Total' : 'Acceso de Personal Limitado'}</span>
                      </div>
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
          <form onSubmit={submitGroup} style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre del Rol</label>
                <input type="text" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} required placeholder="Ej: Cajero, Gestor de Inventario" style={{ width: '100%' }} />
              </div>
            </div>
            
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>Permisos del Rol (Agrupados por Módulo)</label>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {Object.keys(groupedPermissions).sort().map(modelKey => (
                <div key={modelKey} style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                  <h4 style={{ fontSize: '0.7rem', color: 'var(--cta)', letterSpacing: '1px', marginBottom: '10px' }}>{modelNames[modelKey] || modelKey.toUpperCase()}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {groupedPermissions[modelKey].map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.75rem', padding: '5px' }}>
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
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '20px', flexShrink: 0 }}>
              {loading ? 'GUARDANDO...' : 'GUARDAR ROL'}
            </button>
          </form>
        </Modal>
      )}
      <style>{`
        .cms-layout-stack {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        @media (max-width: 1024px) {
          .admin-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 20px !important;
          }

          .modal-content-card {
            padding: 20px !important;
          }

          .admin-title {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Staff
