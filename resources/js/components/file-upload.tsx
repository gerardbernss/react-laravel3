import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FileUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    accept?: string;
    description?: string;
}

export const FileUpload = ({ value, onChange, accept, description = 'PDF, JPG, JPEG, PNG' }: FileUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onChange(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onChange(files[0]);
        }
    };

    return (
        <div>
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                {value ? (
                    <div className="flex items-center justify-between">
                        <span className="truncate text-sm text-gray-700">{value.name}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <svg className="mb-3 h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-gray-500">{description}</p>
                    </div>
                )}
            </div>
            <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </div>
    );
};
