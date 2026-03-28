import { useMemo, useState } from "react";
import { MdDelete, MdEdit, MdError, MdCheckCircle, MdSearch } from "react-icons/md";
import Button from "../components/Button";
import Input from "../components/Input";
import { AddTagModal } from "../components/AddTagModal";
import { EditTagModal } from "../components/EditTagModal";
import { DeletionModal } from "../components/DeletionModal";
import { useAppData } from '../context/AppContext';
import type { Tag } from "../types";
import { getAuthHeaders } from '../utils/index';

const BASE = 'https://99c3-109-166-138-69.ngrok-free.app/api';

const Tags = () => {
    const { tags, refresh } = useAppData();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toEdit, setToEdit] = useState<Tag | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    const addTag = async (name: string, description: string) => {
        if (!name) return showAlert('error', 'Please complete name field');
        try {
            const res = await fetch(`${BASE}/tags`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, description }),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Tag added successfully');
                setIsAddOpen(false);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const editTag = async (tagId: number, name: string, description: string) => {
        if (!name) return showAlert('error', 'Please complete name field');
        try {
            const res = await fetch(`${BASE}/tags/${tagId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, description }),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Tag updated successfully');
                setIsEditOpen(false);
                setToEdit(null);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const deleteTag = async (tagId: number) => {
        try {
            const res = await fetch(`${BASE}/tags/${tagId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Tag deleted successfully');
                setDeleteId(null);
            } else {
                const err = await res.json();
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const filtered = useMemo(() => tags.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    ), [tags, search]);

    return (
        <div className="w-full min-h-screen space-y-6">
            {alert.on && (
                <div className={`fixed top-6 right-6 z-50 w-full max-w-sm rounded-xl p-4 shadow-2xl
                    ${alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-center gap-3">
                        {alert.type === 'error' ? <MdError className="text-xl" /> : <MdCheckCircle className="text-xl" />}
                        <p className="text-sm font-semibold">{alert.msg}</p>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <AddTagModal
                    onClose={() => { setIsAddOpen(false); setValidationErrors(null); }}
                    addTag={addTag}
                    validationErrors={validationErrors}
                />
            )}

            {isEditOpen && toEdit && (
                <EditTagModal
                    onClose={() => { setIsEditOpen(false); setToEdit(null); setValidationErrors(null); }}
                    editTag={editTag}
                    tag={toEdit}
                    validationErrors={validationErrors}
                />
            )}

            {deleteId && (
                <DeletionModal
                    message="Are you sure you want to delete this tag?"
                    onClose={() => setDeleteId(null)}
                    onDelete={() => deleteTag(deleteId)}
                />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-gray-800">Tags</h2>
                    <p className="text-sm text-gray-500 mt-1">Organize couriers using custom tags</p>
                </div>
                <Button onClickAction={() => setIsAddOpen(true)}>+ Add Tag</Button>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500">Total Tags</div>
                <div className="text-2xl font-semibold text-gray-800 mt-1">{tags.length}</div>
            </div>

            <div className="relative max-w-sm">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input nameValue="search" placeholderValue="Search tags..." inputValue={search}
                    hasIcon onChangeAction={(e: any) => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
                <div className="text-gray-500 text-sm">No tags found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(tag => (
                        <div key={tag.id} className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-gray-800">#{tag.name}</h3>
                                    {tag.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tag.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => { setToEdit(tag); setIsEditOpen(true); }}
                                        className="hover:text-blue-600 text-gray-400 transition">
                                        <MdEdit size={16} />
                                    </button>
                                    <button onClick={() => setDeleteId(tag.id)}
                                        className="hover:text-red-600 text-gray-400 transition">
                                        <MdDelete size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-400">ID: {tag.id}</span>
                                {tag.createdAt && (
                                    <span className="text-xs text-gray-400">
                                        {new Date(tag.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tags;