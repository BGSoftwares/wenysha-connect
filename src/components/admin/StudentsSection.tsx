import { Search, Edit, Trash2, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useMemo } from 'react';
import { useDeleteStudent, useUpdateStudent } from '../../lib/hooks';
import { getErrorMessage } from '../../lib/api';
import { toast } from 'sonner';
import StudentDetailDrawer from './StudentDetailDrawer';

interface Student {
    id: number | string;
    name: string;
    student_id: string;
    class_name?: string;
    school_class?: string;
    gender: string;
    status: string;
}

interface StudentsSectionProps {
    students: Student[] | undefined;
    isLoading: boolean;
    error: any;
    classes: any[] | undefined;
    onAddStudent: () => void;
}

const StudentsSection = ({ students, isLoading, error, classes, onAddStudent }: StudentsSectionProps) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailStudent, setDetailStudent] = useState<any | null>(null);

    const updateMutation = useUpdateStudent();
    const deleteMutation = useDeleteStudent();

    const filtered = useMemo(() => {
        const list = students || [];
        return list.filter(s => {
            const matchesSearch = !searchTerm || `${s.name}`.toLowerCase().includes(searchTerm.toLowerCase()) || `${s.student_id}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = !selectedClass || String(s.school_class || s.class_name || '').toLowerCase() === String(selectedClass).toLowerCase();
            return matchesSearch && matchesClass;
        });
    }, [students, searchTerm, selectedClass]);

    const total = filtered.length;
    const paged = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const toggleSelect = (id: number | string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAllOnPage = (checked: boolean) => {
        if (checked) {
            const ids = paged.map(p => p.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        } else {
            const ids = paged.map(p => p.id);
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const handleEdit = async (student: Student) => {
        const newName = window.prompt('Edit student name', student.name);
        if (!newName || newName.trim() === '' || newName === student.name) return;
        try {
            await updateMutation.mutateAsync({ id: Number(student.id), data: { name: newName } as any });
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
        try {
            await deleteMutation.mutateAsync(Number(id));
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return alert('No students selected');
        if (!window.confirm(`Delete ${selectedIds.length} students? This cannot be undone.`)) return;
        try {
            for (const id of selectedIds) {
                // serially delete to keep things simple
                // eslint-disable-next-line no-await-in-loop
                await deleteMutation.mutateAsync(Number(id));
            }
            setSelectedIds([]);
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const handleBulkSetStatus = async (status: string) => {
        if (selectedIds.length === 0) return alert('No students selected');
        try {
            for (const id of selectedIds) {
                // eslint-disable-next-line no-await-in-loop
                await updateMutation.mutateAsync({ id: Number(id), data: { status } as any });
            }
            setSelectedIds([]);
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const handleOpenDetail = (student: any) => {
        setDetailStudent(student);
        setDetailOpen(true);
    };

    const handleSaveFromDrawer = async (id: number | string, data: Record<string, any>) => {
        try {
            await updateMutation.mutateAsync({ id: Number(id), data: { ...data } as any });
            toast.success('Student updated');
        } catch (err) {
            const msg = getErrorMessage(err);
            toast.error(msg);
            throw err;
        }
    };

    const [exportMode, setExportMode] = useState<'filtered'|'page'|'selected'>('filtered');

    const exportCsv = (mode: 'filtered'|'page'|'selected' = 'filtered') => {
        let rowsSource = filtered;
        if (mode === 'page') rowsSource = paged;
        if (mode === 'selected') rowsSource = (students || []).filter(s => selectedIds.includes(s.id));

        const rows = rowsSource.map(s => ({
            id: s.id,
            name: s.name,
            student_id: s.student_id,
            class: s.class_name || s.school_class,
            gender: s.gender,
            status: s.status,
        }));
        if (rows.length === 0) return alert('No rows to export');
        const headers = Object.keys(rows[0] || {});
        const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '')}"`).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_export_${mode}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Student Management</h2>
                <Button onClick={onAddStudent} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll Student
                </Button>
            </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
                <div className="p-4 border-b border-border flex items-center gap-4 bg-secondary/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                        <option value="">All Classes</option>
                        {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                        <div className="flex items-center gap-2 ml-4">
                            <select value={exportMode} onChange={(e) => setExportMode(e.target.value as any)} className="px-3 py-1 rounded border border-border bg-background text-sm">
                                <option value="filtered">Export: Filtered</option>
                                <option value="page">Export: Current Page</option>
                                <option value="selected">Export: Selected</option>
                            </select>
                            <Button variant="outline" onClick={() => exportCsv(exportMode)} className="flex items-center gap-2 transform transition-transform hover:scale-105">
                                <Download className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Export CSV</span>
                            </Button>
                            <select onChange={(e) => { const v = e.target.value; if (v === 'delete') handleBulkDelete(); else if (v === 'active') handleBulkSetStatus('Active'); else if (v === 'inactive') handleBulkSetStatus('Inactive'); e.target.value=''; }} defaultValue="" className="px-3 py-1 rounded border border-border bg-background text-sm">
                                <option value="">Bulk Actions</option>
                                <option value="active">Set Active</option>
                                <option value="inactive">Set Inactive</option>
                                <option value="delete">Delete Selected</option>
                            </select>
                        </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span>Loading students...</span>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-destructive bg-destructive/5 border-b border-border">
                        Failed to load students. Please try again later.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                        <input type="checkbox" onChange={(e) => selectAllOnPage(e.target.checked)} checked={paged.length>0 && paged.every(p=>selectedIds.includes(p.id))} />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Student ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Class</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Gender</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paged.map((student) => (
                                    <tr key={student.id} className="hover:bg-secondary/30 transition-colors odd:bg-background even:bg-background/50">
                                        <td className="px-4 py-4">
                                            <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">{student.name}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.student_id}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.class_name || student.school_class}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.gender}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${student.status === 'Active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(student)} disabled={updateMutation.isLoading} className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                    <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </button>
                                                <button onClick={() => handleOpenDetail(student)} className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                    <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a8 8 0 0 0 0-6"/></svg>
                                                </button>
                                                <button onClick={() => handleDelete(student.id)} disabled={deleteMutation.isLoading} className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                                            No students found in the database.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="p-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Showing {(filtered.length===0)?0:((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, filtered.length)} of {filtered.length}</div>
                    <div className="flex items-center gap-3">
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1 rounded border border-border bg-background text-foreground">
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage<=1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="px-3 py-1 rounded border border-border bg-background">Prev</button>
                            <span className="text-sm">Page {currentPage}</span>
                            <button disabled={currentPage*pageSize >= filtered.length} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 rounded border border-border bg-background">Next</button>
                        </div>
                    </div>
                </div>
                <StudentDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} student={detailStudent} classes={classes} onSave={handleSaveFromDrawer} />
            </div>
        </div>
    );
};

export default StudentsSection;
