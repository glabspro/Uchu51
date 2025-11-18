import React, { useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { ArrowUpOnSquareIcon, TrashIcon } from './icons';

interface ImageUploadProps {
    currentImageUrl: string;
    onImageChange: (url: string) => void;
    bucket?: string;
    label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImageUrl, onImageChange, bucket = 'images', label = 'Imagen' }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen para subir.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            
            onImageChange(data.publicUrl);
        } catch (error: any) {
            alert('Error subiendo la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageChange('');
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-2">{label}</label>
            <div className="flex items-start gap-4">
                <div 
                    className="relative w-32 h-32 rounded-lg bg-background dark:bg-zinc-700/50 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-text-primary/10 dark:border-zinc-600 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={triggerFileInput}
                >
                    {currentImageUrl ? (
                        <>
                            <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold">Cambiar</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ArrowUpOnSquareIcon className="h-8 w-8 mx-auto text-text-secondary dark:text-zinc-500 mb-1" />
                            <span className="text-text-secondary dark:text-zinc-500 text-xs">Subir Foto</span>
                        </div>
                    )}
                    
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                             <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex-grow space-y-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={uploadImage}
                        accept="image/*"
                        className="hidden"
                    />
                    <div className="flex flex-col gap-2">
                        <button 
                            type="button"
                            onClick={triggerFileInput}
                            disabled={uploading}
                            className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold py-2 px-4 rounded-lg text-sm transition-colors text-left w-full sm:w-auto"
                        >
                            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                        </button>
                        
                        <div className="relative">
                            <input 
                                type="text" 
                                value={currentImageUrl} 
                                onChange={(e) => onImageChange(e.target.value)}
                                placeholder="O pega una URL externa aquí..."
                                className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-md p-2 text-xs" 
                            />
                        </div>

                        {currentImageUrl && (
                            <button 
                                type="button"
                                onClick={handleClear}
                                className="text-danger text-xs font-semibold flex items-center gap-1 hover:underline w-fit"
                            >
                                <TrashIcon className="h-3 w-3" /> Eliminar imagen
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-text-secondary dark:text-zinc-500">
                        Formatos: JPG, PNG, WEBP. Máx 2MB.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;