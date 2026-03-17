import { useState } from 'react';
import type { AnalyzeRequest } from '../../types/report';
import './SearchForm.css';

interface SearchFormProps {
    onSubmit: (request: AnalyzeRequest) => void;
    isLoading: boolean;
}

const PROPERTY_TYPES = [
    { value: 'lägenhet', label: 'Lägenhet (Apartment)' },
    { value: 'radhus', label: 'Radhus (Terraced House)' },
    { value: 'villa', label: 'Villa' },
    { value: 'fritidshus', label: 'Fritidshus (Holiday Home)' },
    { value: 'tomt', label: 'Tomt (Plot)' },
];

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [address, setAddress] = useState('');
    const [propertyType, setPropertyType] = useState('lägenhet');
    const [hemnetUrl, setHemnetUrl] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim()) return;
        onSubmit({
            address: address.trim(),
            propertyType,
            hemnetUrl: hemnetUrl.trim() || undefined,
        });
    };

    return (
        <form className="search-form glass-card animate-in" onSubmit={handleSubmit}>
            <div className="form-header">
                <h2 className="form-title">Analyze a Property</h2>
                <p className="form-description">
                    Enter a Swedish property address and our AI will research market data,
                    structural risks, and provide a comprehensive investment review.
                </p>
            </div>

            <div className="form-body">
                <div className="form-field">
                    <label htmlFor="property-type" className="field-label">Property Type</label>
                    <select
                        id="property-type"
                        className="field-select"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                    >
                        {PROPERTY_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="property-address" className="field-label">Property Address</label>
                    <input
                        id="property-address"
                        type="text"
                        className="field-input"
                        placeholder="e.g. Prästgatan 20, Stockaryd"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="button"
                    className="advanced-toggle"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? '− Less options' : '+ More options'}
                </button>

                {showAdvanced && (
                    <div className="form-field animate-in">
                        <label htmlFor="hemnet-url" className="field-label">
                            Hemnet / Booli URL <span className="field-optional">(optional)</span>
                        </label>
                        <input
                            id="hemnet-url"
                            type="url"
                            className="field-input"
                            placeholder="https://www.hemnet.se/bostad/..."
                            value={hemnetUrl}
                            onChange={(e) => setHemnetUrl(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading || !address.trim()}
                >
                    {isLoading ? (
                        <span className="submit-loading">
                            <span className="spinner" />
                            <span>Analyzing with AI...</span>
                        </span>
                    ) : (
                        <span className="submit-ready">
                            <span>🔍</span>
                            <span>Analyze Property</span>
                        </span>
                    )}
                </button>
            </div>
        </form>
    );
}
