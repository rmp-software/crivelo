'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import Button from './Button';
import Input from './Input';
import { Upload, X } from 'lucide-react';

export interface SponsorFormData {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

interface SponsorFormProps {
  mode: 'create' | 'edit';
  initialData?: SponsorFormData;
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB — matches lib/file-upload.ts and the spec

export default function SponsorForm({ mode, initialData, onSuccess, onCancel }: SponsorFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.logo_url || '');
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; logo?: string; website?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nome obrigatório';
    }

    if (website.trim()) {
      try {
        const parsed = new URL(website.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          newErrors.website = 'Site inválido';
        }
      } catch {
        newErrors.website = 'Site inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrors({ ...errors, logo: 'Arquivo deve ter menos de 4MB' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setErrors({ ...errors, logo: 'Arquivo deve ser JPG ou PNG' });
      return;
    }

    setLogoFile(file);
    setRemoveLogo(false);
    setErrors({ ...errors, logo: undefined });

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    // Clear the preview so the drop-zone / fallback shows. In edit mode, record the
    // intent to clear the persisted logo so submit can tell the server to drop it.
    setLogoPreview('');
    if (mode === 'edit' && initialData?.logo_url) {
      setRemoveLogo(true);
    }
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
      formData.append('website', website.trim());

      if (logoFile) {
        // A new file always takes precedence over a pending remove intent.
        formData.append('logo', logoFile);
      } else if (removeLogo) {
        formData.append('remove_logo', '1');
      }

      const url = mode === 'create' ? '/api/sponsors' : `/api/sponsors/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Não foi possível salvar o patrocinador');
      }

      onSuccess();
    } catch (err: any) {
      setGeneralError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
          placeholder="Nome do patrocinador"
        />
      </div>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--fg-2)] mb-1.5">Logo</label>

        {logoPreview && (
          <div className="relative w-32 h-32 mb-4 rounded-[var(--radius-md)] overflow-hidden border-2 border-[var(--border)] bg-[var(--bg-2)]">
            <img src={logoPreview} alt="Pré-visualização do logo" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-2 right-2 p-1.5 bg-[var(--danger)] text-white rounded-full hover:bg-[#9E2F24] transition-colors"
              aria-label="Remover logo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!logoPreview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] cursor-pointer transition-colors text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Upload size={24} className="text-[var(--fg-3)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">Toque para enviar logo</p>
                <p className="text-xs text-[var(--fg-3)] mt-1">JPG ou PNG, máx. 4MB</p>
              </div>
            </div>
          </div>
        )}

        {logoPreview && !logoFile && (
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Trocar logo
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {errors.logo && <p className="mt-1.5 text-sm text-[var(--danger)]">{errors.logo}</p>}
      </div>

      {/* Website Input */}
      <div className="mb-6">
        <Input
          label="Site"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          error={errors.website}
          fullWidth
          placeholder="https://exemplo.com"
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
    </form>
  );
}
