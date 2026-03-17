import { useEffect, useState } from 'react';
import './Header.css';

export function Header() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('spa_theme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('spa_theme', theme);
    }, [theme]);

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-brand">
                    <div className="brand-icon">🏠</div>
                    <div>
                        <h1 className="brand-title">
                            Property Analyzer
                            <span className="brand-flag">
                                <span className="flag-se">SE</span>
                            </span>
                        </h1>
                        <p className="brand-subtitle">AI-powered Swedish property analysis</p>
                    </div>
                </div>
                <button
                    className="theme-toggle"
                    onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                    aria-label="Toggle theme"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                </button>
            </div>
        </header>
    );
}
