import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { MdPhone, MdLocationCity, MdPerson, MdBusinessCenter, MdAttachMoney, MdDescription, MdPublic, MdEmail, MdUpload, MdDelete, MdDownload, MdError } from "react-icons/md"
import { FaFileContract, FaIdCard, FaFileAlt } from "react-icons/fa"
import type { Courier, Tag, City, Manager, Account } from "../types"
import Spinner from "../components/Spinner"
import Card from "../components/Card"
import { getAuthHeaders, getAuthHeadersNoContentType } from '../utils/index';
import logoBolt from "../../public/bolt-1.svg"
import logoWolt from '../../public/idcxOwdB80_1769177945180.jpeg'
import logoGlovo from '../../public/idgSGGe-zp_1769177931923.jpeg'

interface MyFileDto {
    id: number;
    originalFileName: string;
    storedFileName: string;
    path: string;
    fileUrl: string;
    contentType: string;
    size: number;
    extension: string;
    createdAt: string;
    updatedAt: string;
    myFileCategory: "TRC" | "CONTRACT" | "GENERAL";
    courierId: number;
}

const CourierDetails = () => {
    const [courier, setCourier] = useState<Courier | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [files, setFiles] = useState<MyFileDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({ isActive: false, type: "error", message: "" });

    const { courierId } = useParams();

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, isActive: false }));
        }, 3000);
    };

    const getTagName = (id: number) => {
        return tags.find(tag => tag.id === id)?.name || '';
    }

    const getCityName = (id: number) => {
        return cities.find(city => city.id === id)?.name || '';
    }

    const getManagerFullName = (id: number) => {
        const manager = managers.find(manager => manager.id === id);
        return manager ? `${manager.firstname} ${manager.lastname}` : '';
    }

    const getPlatformLogo = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'bolt':
                return <img src={logoBolt} alt="Bolt" className="w-6 h-6 object-contain" />;
            case 'glovo':
                return <img src={logoGlovo} alt="Glovo" className="w-6 h-6 object-contain rounded" />;
            case 'wolt':
                return <img src={logoWolt} alt="Wolt" className="w-6 h-6 object-contain rounded" />;
            default:
                return <MdBusinessCenter size={18} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleFileUpload = async (category: "TRC" | "CONTRACT" | "GENERAL", event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !courierId) return;

        setUploadingCategory(category);

        const formData = new FormData();
        formData.append('file', file);

        try {
            let endpoint = '';
            switch (category) {
                case 'TRC':
                    endpoint = `https://99c3-109-166-138-69.ngrok-free.app/api/files/upload-trc/courier/${courierId}`;
                    break;
                case 'CONTRACT':
                    endpoint = `https://99c3-109-166-138-69.ngrok-free.app/api/files/upload-contract/courier/${courierId}`;
                    break;
                case 'GENERAL':
                    endpoint = `https://99c3-109-166-138-69.ngrok-free.app/api/files/upload-general-file/courier/${courierId}`;
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeadersNoContentType(),
                body: formData,
            });

            if (response.ok) {
                const newFile = await response.json();
                setFiles(prev => [...prev, newFile]);
                showAlert("success", `${category} file uploaded successfully`);
            } else {
                const error = await response.text();
                showAlert("error", error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            showAlert("error", "Failed to upload file");
        } finally {
            setUploadingCategory(null);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleFileDownload = async (fileUrl: string, originalFileName: string) => {
        try {
            const response = await fetch(
                `https://99c3-109-166-138-69.ngrok-free.app/api/files/download?file-url=${encodeURIComponent(fileUrl)}`,
                {
                    headers: getAuthHeadersNoContentType()
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = originalFileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showAlert("success", "File downloaded successfully");
            } else {
                showAlert("error", "Failed to download file");
            }
        } catch (error) {
            console.error("Download error:", error);
            showAlert("error", "Failed to download file");
        }
    };

    const handleFileDelete = async (fileId: number) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        try {
            const response = await fetch(
                `https://99c3-109-166-138-69.ngrok-free.app/api/files/delete-file/${fileId}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                setFiles(prev => prev.filter(f => f.id !== fileId));
                showAlert("success", "File deleted successfully");
            } else {
                showAlert("error", "Failed to delete file");
            }
        } catch (error) {
            console.error("Delete error:", error);
            showAlert("error", "Failed to delete file");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFilesByCategory = (category: "TRC" | "CONTRACT" | "GENERAL") => {
        return files.filter(f => f.myFileCategory === category);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [couriersResponse, tagsResponse, citiesResponse, managersResponse, accountsResponse, filesResponse] = await Promise.all([
                    fetch(`https://99c3-109-166-138-69.ngrok-free.app/api/couriers/${courierId}`, {
                        headers: getAuthHeadersNoContentType()
                    }),
                    fetch('https://99c3-109-166-138-69.ngrok-free.app/api/tags', {
                        headers: getAuthHeadersNoContentType()
                    }),
                    fetch('https://99c3-109-166-138-69.ngrok-free.app/api/cities', {
                        headers: getAuthHeadersNoContentType()
                    }),
                    fetch('https://99c3-109-166-138-69.ngrok-free.app/api/managers', {
                        headers: getAuthHeadersNoContentType()
                    }),
                    fetch('https://99c3-109-166-138-69.ngrok-free.app/api/accounts', {
                        headers: getAuthHeadersNoContentType()
                    }),
                    fetch(`https://99c3-109-166-138-69.ngrok-free.app/api/files/courier/${courierId}`, {
                        headers: getAuthHeadersNoContentType()
                    })
                ]);

                const [couriersData, tagsData, citiesData, managersData, accountsData, filesData] = await Promise.all([
                    couriersResponse.json(),
                    tagsResponse.json(),
                    citiesResponse.json(),
                    managersResponse.json(),
                    accountsResponse.json(),
                    filesResponse.json()
                ]);

                setCourier(couriersData);
                setTags(tagsData);
                setCities(citiesData);
                setManagers(managersData);
                setAccounts(accountsData.filter((acc: Account) => acc.courierId === Number(courierId)));
                setFiles(filesData);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (courierId) {
            fetchData();
        }
    }, [courierId]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <Spinner size={12} />
            </div>
        );
    }

    if (!courier) {
        return (
            <div className="w-full px-6 py-6">
                <p className="text-center text-gray-500">Courier not found</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Alert */}
            {alert.isActive && (
                <div className={`fixed top-5 right-5 z-100 max-w-sm w-full shadow-xl rounded-2xl p-4 animate-toast
                    ${alert.type === 'error' ? 'bg-[var(--error-bg)] text-[var(--error-text)]' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-start gap-3">
                        <MdError className={`mt-0.5 text-lg ${alert.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className="text-sm font-semibold">{alert.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                        {courier.firstname} {courier.lastname}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {courier.tagIds?.length ? (
                            courier.tagIds.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100"
                                >
                                    {getTagName(tag)}
                                </span>
                            ))
                        ) : null}
                    </div>
                </div>
                <span className="text-sm text-gray-500">ID: {courier.id}</span>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card type="light" className="!min-h-fit !p-4">
                    <div className="flex items-center gap-3">
                        <MdPhone size={18} />
                        <div>
                            <p className="text-xs opacity-60">Phone</p>
                            <p className="font-medium">{courier.phoneNumber}</p>
                        </div>
                    </div>
                </Card>

                <Card type="light" className="!min-h-fit !p-4">
                    <div className="flex items-center gap-3">
                        <MdPublic size={18} />
                        <div>
                            <p className="text-xs opacity-60">Nationality</p>
                            <p className="font-medium">{courier.nationality}</p>
                        </div>
                    </div>
                </Card>

                <Card type="light" className="!min-h-fit !p-4">
                    <div className="flex items-center gap-3">
                        <MdLocationCity size={18} />
                        <div>
                            <p className="text-xs opacity-60">City</p>
                            <p className="font-medium">{getCityName(courier.cityId)}</p>
                        </div>
                    </div>
                </Card>

                <Card type="light" className="!min-h-fit !p-4">
                    <div className="flex items-center gap-3">
                        <MdPerson size={18} />
                        <div>
                            <p className="text-xs opacity-60">Manager</p>
                            <p className="font-medium">{getManagerFullName(courier.managerId)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card type="dark" className="!h-40">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <MdAttachMoney size={20} />
                            <span className="text-sm font-medium">CTR</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{courier.ctr}</p>
                            <p className="text-sm opacity-75">RON</p>
                        </div>
                    </div>
                </Card>

                <Card type="dark" className="!h-40">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <MdBusinessCenter size={20} />
                            <span className="text-sm font-medium">Commission</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{courier.commission}</p>
                            <p className="text-sm opacity-75">Percent</p>
                        </div>
                    </div>
                </Card>

                <Card type="dark" className="!h-40">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <MdAttachMoney size={20} />
                            <span className="text-sm font-medium">Debt</span>
                        </div>
                        <div>
                            <p className={`text-3xl font-bold ${courier.debt > 0 ? 'text-red-300' : ''}`}>
                                {courier.debt}
                            </p>
                            <p className="text-sm opacity-75">RON</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Accounts Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <MdBusinessCenter size={20} />
                    <h3 className="text-lg font-semibold">Accounts</h3>
                    <span className="text-sm opacity-60">({accounts.length})</span>
                </div>

                {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map((account) => (
                            <Card key={account.id} type="light" className="!min-h-fit !p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getPlatformLogo(account.platform)}
                                            <span className="font-semibold">{account.platform}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(account.status)}`}>
                                            {account.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs opacity-60">Account Name</p>
                                            <p className="font-medium text-sm">{account.accountName}</p>
                                        </div>

                                        {account.accountUID && (
                                            <div>
                                                <p className="text-xs opacity-60">UID</p>
                                                <p className="font-medium text-sm">{account.accountUID}</p>
                                            </div>
                                        )}

                                        {account.phoneNumber && (
                                            <div className="flex items-center gap-2">
                                                <MdPhone size={14} className="opacity-60" />
                                                <p className="text-sm">{account.phoneNumber}</p>
                                            </div>
                                        )}

                                        {account.email && (
                                            <div className="flex items-center gap-2">
                                                <MdEmail size={14} className="opacity-60" />
                                                <p className="text-sm truncate">{account.email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card type="light" className="!min-h-fit !p-6">
                        <p className="text-center opacity-60">No accounts found</p>
                    </Card>
                )}
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <MdDescription size={20} />
                    <h3 className="text-lg font-semibold">Documents</h3>
                </div>

                {/* TRC Files */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <FaIdCard size={16} />
                            TRC (Transport Registration Certificate)
                        </h4>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload('TRC', e)}
                                disabled={uploadingCategory === 'TRC'}
                            />
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${uploadingCategory === 'TRC'
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[var(--accent-dark)] text-white hover:opacity-75 cursor-pointer'
                                }`}>
                                <MdUpload size={16} />
                                {uploadingCategory === 'TRC' ? 'Uploading...' : 'Upload TRC'}
                            </span>
                        </label>
                    </div>

                    {getFilesByCategory('TRC').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {getFilesByCategory('TRC').map(file => (
                                <Card key={file.id} type="light" className="!min-h-fit !p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.originalFileName}</p>
                                            <p className="text-xs opacity-60">{formatFileSize(file.size)}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                            <button
                                                onClick={() => handleFileDownload(file.fileUrl || file.path, file.originalFileName)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <MdDownload size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleFileDelete(file.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-60">No TRC files uploaded</p>
                    )}
                </div>

                {/* Contract Files */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <FaFileContract size={16} />
                            Contract Documents
                        </h4>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload('CONTRACT', e)}
                                disabled={uploadingCategory === 'CONTRACT'}
                            />
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadingCategory === 'CONTRACT'
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[var(--accent-dark)] text-white hover:opacity-75 cursor-pointer'
                                }`}>
                                <MdUpload size={16} />
                                {uploadingCategory === 'CONTRACT' ? 'Uploading...' : 'Upload Contract'}
                            </span>
                        </label>
                    </div>

                    {getFilesByCategory('CONTRACT').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {getFilesByCategory('CONTRACT').map(file => (
                                <Card key={file.id} type="light" className="!min-h-fit !p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.originalFileName}</p>
                                            <p className="text-xs opacity-60">{formatFileSize(file.size)}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                            <button
                                                onClick={() => handleFileDownload(file.fileUrl || file.path, file.originalFileName)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <MdDownload size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleFileDelete(file.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-60">No contract files uploaded</p>
                    )}
                </div>

                {/* General Files */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <FaFileAlt size={16} />
                            General Files
                        </h4>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload('GENERAL', e)}
                                disabled={uploadingCategory === 'GENERAL'}
                            />
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadingCategory === 'GENERAL'
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[var(--accent-dark)] text-white hover:opacity-75 cursor-pointer'
                                }`}>
                                <MdUpload size={16} />
                                {uploadingCategory === 'GENERAL' ? 'Uploading...' : 'Upload File'}
                            </span>
                        </label>
                    </div>

                    {getFilesByCategory('GENERAL').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {getFilesByCategory('GENERAL').map(file => (
                                <Card key={file.id} type="light" className="!min-h-fit !p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.originalFileName}</p>
                                            <p className="text-xs opacity-60">{formatFileSize(file.size)}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                            <button
                                                onClick={() => handleFileDownload(file.fileUrl || file.path, file.originalFileName)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <MdDownload size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleFileDelete(file.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-60">No general files uploaded</p>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-6 text-xs opacity-60">
                    <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(courier.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </div>
                    <div>
                        <span className="font-medium">Updated:</span>{' '}
                        {new Date(courier.updatedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourierDetails;