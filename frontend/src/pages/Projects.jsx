import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineFolder, HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { projectsAPI } from '../api';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

const BLANK = { name: '', description: '' };

const STATUS_COLORS = {
    active: { bg: 'var(--accent-glow)', c: 'var(--accent-light)' },
    completed: { bg: 'var(--success-bg)', c: 'var(--success)' },
    paused: { bg: 'var(--warning-bg)', c: 'var(--warning)' },
};

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newProject, setNewProject] = useState(BLANK);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ ...BLANK, status: 'active' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(() => {
        setIsLoading(true);
        projectsAPI.list()
            .then(r => setProjects(r.data.results || r.data))
            .catch(() => toast.error('Failed to load projects'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await projectsAPI.create(newProject);
            setNewProject(BLANK);
            setShowForm(false);
            load();
            toast.success('Project created!');
        } catch {
            toast.error('Failed to create project');
        }
    };

    const startEdit = (project) => {
        setEditingId(project.id);
        setEditData({ name: project.name, description: project.description || '', status: project.status || 'active' });
    };

    const saveEdit = async (id) => {
        try {
            await projectsAPI.update(id, editData);
            setEditingId(null);
            load();
            toast.success('Project updated!');
        } catch {
            toast.error('Failed to update project');
        }
    };

    const deleteProject = async (id) => {
        try {
            await projectsAPI.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            setConfirmDeleteId(null);
            toast.success('Project deleted');
        } catch {
            toast.error('Failed to delete project');
        }
    };

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SEO title="Projects" description="Organize your work into focused projects." />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projects</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Organize your work into focused projects</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                    border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <HiOutlinePlus style={{ width: '16px', height: '16px' }} /> New Project
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} onSubmit={create}
                        style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}
                    >
                        <input type="text" placeholder="Project name" value={newProject.name}
                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                            autoFocus required style={{ ...inputStyle, fontSize: '1rem' }} />
                        <textarea placeholder="What is this project about?" value={newProject.description}
                            onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                            rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Create</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} style={{ ...cardStyle, height: '100px', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : projects.map((project, i) => (
                    <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        {editingId === project.id ? (
                            <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderColor: 'var(--accent)' }}>
                                <input type="text" value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    autoFocus style={{ ...inputStyle, fontSize: '1rem' }} />
                                <textarea value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} style={{ ...inputStyle, width: 'auto' }}>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                                            <HiOutlineX style={{ width: '14px', height: '14px' }} /> Cancel
                                        </button>
                                        <button onClick={() => saveEdit(project.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>
                                            <HiOutlineCheck style={{ width: '14px', height: '14px' }} /> Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ ...cardStyle, padding: '24px', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', flexShrink: 0 }}>
                                            <HiOutlineFolder style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</h3>
                                            {project.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>{project.description}</p>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
                                        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, ...(STATUS_COLORS[project.status] || STATUS_COLORS.active) }}>
                                            {project.status || 'active'}
                                        </span>
                                        <button onClick={() => startEdit(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', borderRadius: '6px' }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                                            <HiOutlinePencil style={{ width: '15px', height: '15px' }} />
                                        </button>
                                        {confirmDeleteId === project.id ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delete?</span>
                                                <button onClick={() => deleteProject(project.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
                                                <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDeleteId(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'inherit' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>Delete</button>
                                        )}
                                    </div>
                                </div>
                                {(project.task_count !== undefined) && (
                                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{project.task_count || 0} tasks</span>
                                        {project.completed_task_count !== undefined && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{project.completed_task_count} done</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {!isLoading && projects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📁</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No projects yet</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginTop: '4px' }}>Create a project to group related tasks</p>
                    </div>
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        </div>
    );
}
