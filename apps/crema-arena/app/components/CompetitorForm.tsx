'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';
import Input from './Input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface CompetitorFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    name: string;
    coffeeShop: string;
    photoUrl: string;
  };
}

export default function CompetitorForm({ mode, initialData }: CompetitorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [coffeeShop, setCoffeeShop] = useState(initialData?.coffeeShop || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoUrl || '');
  const [errors, setErrors] = useState<{ name?: string; coffeeShop?: string; photo?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim() || name.length < 2) {
      newErrors.name = 'Nome obrigatório e com pelo menos 2 caracteres';
    }

    if (!coffeeShop.trim() || coffeeShop.length < 2) {
      newErrors.coffeeShop = 'Cafeteria obrigatória e com pelo menos 2 caracteres';
    }

    if (mode === 'create' && !photoFile) {
      newErrors.photo = 'Foto obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, photo: 'Arquivo deve ter menos de 5MB' });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setErrors({ ...errors, photo: 'Arquivo deve ser JPG ou PNG' });
      return;
    }

    setPhotoFile(file);
    setErrors({ ...errors, photo: undefined });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(mode === 'edit' ? initialData?.photoUrl || '' : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('coffee_shop', coffeeShop.trim());

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const url = mode === 'create'
        ? '/api/competitors'
        : `/api/competitors/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} competitor`);
      }

      // Redirect to competitors list
      router.push('/dashboard/competitors');
      router.refresh();
    } catch (err: any) {
      setGeneralError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/competitors');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* General Error */}
      {generalError && (
        <div className="mb-6 p-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
          {generalError}
        </div>
      )}

      {/* Name Input */}
      <div className="mb-6">
        <Input
          label="Nome"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          fullWidth
          placeholder="Nome do competidor"
        />
      </div>

      {/* Coffee Shop Input */}
      <div className="mb-6">
        <Input
          label="Cafeteria"
          type="text"
          value={coffeeShop}
          onChange={(e) => setCoffeeShop(e.target.value)}
          error={errors.coffeeShop}
          required
          fullWidth
          placeholder="Nome da cafeteria"
        />
      </div>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--fg-2)] mb-1.5">
          Photo
          {mode === 'create' && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>

        {/* Photo Preview */}
        {photoPreview && (
          <div className="relative w-48 h-48 mb-4 rounded-[var(--radius-md)] overflow-hidden border-2 border-[var(--border)] bg-[var(--bg-2)]">
            <img
              src={photoPreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 p-1.5 bg-[var(--danger)] text-white rounded-full hover:bg-[#9E2F24] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Upload Button/Area */}
        {!photoPreview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] cursor-pointer transition-colors text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Upload size={24} className="text-[var(--fg-3)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">
                  Toque para enviar foto
                </p>
                <p className="text-xs text-[var(--fg-3)] mt-1">
                  JPG ou PNG, máx. 4MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trocar foto Button (Edit mode with existing photo) */}
        {photoPreview && mode === 'edit' && !photoFile && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Trocar foto
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {errors.photo && (
          <p className="mt-1.5 text-sm text-[var(--danger)]">{errors.photo}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {mode === 'create' ? 'Criando...' : 'Salvando...'}
            </>
          ) : (
            mode === 'create' ? 'Criar competidor' : 'Salvar alterações'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
