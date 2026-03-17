import './styles/globals.css';
import { Header } from './components/Layout/Header';
import { SearchForm } from './components/Search/SearchForm';
import { ReportView } from './components/Results/ReportView';
import { useAnalysis } from './hooks/useAnalysis';
import type { AnalyzeRequest } from './types/report';

export default function App() {
    const { report, isLoading, error, analyze, clearReport } = useAnalysis();

    const handleSubmit = (request: AnalyzeRequest) => {
        analyze(request);
    };

    return (
        <div className="app-wrapper">
            <Header />

            {!report && (
                <>
                    <SearchForm onSubmit={handleSubmit} isLoading={isLoading} />

                    {isLoading && (
                        <div className="loading-state animate-in" style={{ marginTop: '2rem' }}>
                            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                                <div className="loading-spinner-lg" />
                                <h3 style={{ marginTop: '1.5rem', fontWeight: 600 }}>Analyzing Property...</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    Our AI is researching market data, inspecting public records,
                                    and generating your comprehensive property review.
                                </p>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    This typically takes 10–20 seconds.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-state animate-in" style={{ marginTop: '1.5rem' }}>
                            <div className="glass-card" style={{
                                padding: '1.5rem',
                                borderColor: 'rgba(248, 113, 113, 0.3)',
                                background: 'var(--accent-red-bg)',
                            }}>
                                <h3 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>⚠️ Analysis Failed</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
                                <button
                                    onClick={clearReport}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem 1rem',
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-sans)',
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {report && <ReportView report={report} onNewSearch={clearReport} />}
        </div>
    );
}
