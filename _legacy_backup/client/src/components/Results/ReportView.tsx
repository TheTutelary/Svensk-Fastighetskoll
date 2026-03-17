import type { PropertyReport } from '../../types/report';
import './ReportView.css';

interface ReportViewProps {
    report: PropertyReport;
    onNewSearch: () => void;
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
    const config: Record<string, { emoji: string; className: string; label: string }> = {
        BUY: { emoji: '✅', className: 'rec-buy', label: 'BUY' },
        NEGOTIATE: { emoji: '⚡', className: 'rec-negotiate', label: 'NEGOTIATE' },
        AVOID: { emoji: '🚫', className: 'rec-avoid', label: 'AVOID' },
    };
    const c = config[recommendation] || config.NEGOTIATE;
    return (
        <span className={`rec-badge ${c.className}`}>
            {c.emoji} {c.label}
        </span>
    );
}

export function ReportView({ report, onNewSearch }: ReportViewProps) {
    const scorePercent = Math.round((report.totalScore / report.totalMaxScore) * 100);

    return (
        <div className="report animate-in">
            {/* Header with address & score */}
            <div className="report-hero glass-card">
                <div className="hero-top">
                    <button className="back-btn" onClick={onNewSearch} title="New search">
                        ← New Analysis
                    </button>
                    <div className="score-ring" data-score={scorePercent}>
                        <svg viewBox="0 0 36 36" className="score-svg">
                            <path
                                className="score-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="score-fill"
                                strokeDasharray={`${scorePercent}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="score-number">
                            <span className="score-value">{report.totalScore}</span>
                            <span className="score-max">/{report.totalMaxScore}</span>
                        </div>
                    </div>
                </div>

                <div className="hero-body">
                    <h1 className="hero-address">{report.address}</h1>
                    <div className="hero-meta">
                        {report.propertyType && <span className="meta-tag">{report.propertyType}</span>}
                        {report.municipality && <span className="meta-tag">{report.municipality}</span>}
                        {report.buildYear && <span className="meta-tag">Built {report.buildYear}</span>}
                        {report.livingArea && <span className="meta-tag">{report.livingArea}</span>}
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <section className="report-section glass-card animate-in stagger-1">
                <div className="section-header">
                    <h2 className="section-title">Executive Summary</h2>
                    <RecommendationBadge recommendation={report.recommendation} />
                </div>
                <p className="executive-text">{report.executiveSummary}</p>
            </section>

            {/* Valuation Snapshot */}
            <section className="report-section glass-card animate-in stagger-2">
                <h2 className="section-title">Valuation Snapshot</h2>
                <div className="valuation-grid">
                    <div className="val-card">
                        <span className="val-label">Past Value</span>
                        <span className="val-amount">{report.valuation.pastValue}</span>
                        <span className="val-context">{report.valuation.pastValueContext}</span>
                    </div>
                    <div className="val-card val-highlight">
                        <span className="val-label">Current Ask</span>
                        <span className="val-amount">{report.valuation.currentAsk}</span>
                    </div>
                    <div className="val-card">
                        <span className="val-label">Fair Value (Est.)</span>
                        <span className="val-amount accent-green">{report.valuation.estimatedFairValue}</span>
                        <span className="val-context">{report.valuation.fairValueReasoning}</span>
                    </div>
                    <div className="val-card">
                        <span className="val-label">5-Year Estimate</span>
                        <span className="val-amount">{report.valuation.futureEstimate5Years}</span>
                        <span className="val-context">{report.valuation.futureEstimateAssumptions}</span>
                    </div>
                </div>
            </section>

            {/* Scorecard */}
            <section className="report-section glass-card animate-in stagger-3">
                <div className="section-header">
                    <h2 className="section-title">The Scorecard</h2>
                    <span className="score-summary-tag">"{report.scoreSummary}"</span>
                </div>
                <div className="scorecard-table">
                    <div className="sc-header-row">
                        <span>Category</span>
                        <span>Score</span>
                        <span>Notes</span>
                    </div>
                    {report.scorecard.map((cat, i) => {
                        const pct = Math.round((cat.score / cat.maxScore) * 100);
                        return (
                            <div className={`sc-row animate-in stagger-${i + 1}`} key={cat.category}>
                                <span className="sc-category">{cat.category}</span>
                                <div className="sc-score-cell">
                                    <div className="sc-bar-wrap">
                                        <div
                                            className={`sc-bar ${pct >= 70 ? 'bar-good' : pct >= 40 ? 'bar-ok' : 'bar-bad'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="sc-score-text">{cat.score}/{cat.maxScore}</span>
                                </div>
                                <span className="sc-notes">{cat.notes}</span>
                            </div>
                        );
                    })}
                    <div className="sc-total-row">
                        <span className="sc-category">TOTAL SCORE</span>
                        <div className="sc-score-cell">
                            <span className="sc-score-text sc-total">{report.totalScore}/{report.totalMaxScore}</span>
                        </div>
                        <span className="sc-notes" />
                    </div>
                </div>
            </section>

            {/* Critical Risks */}
            {report.risks.length > 0 && (
                <section className="report-section glass-card animate-in stagger-4">
                    <h2 className="section-title">Critical Technical Risks</h2>
                    <div className="risks-list">
                        {report.risks.map((risk, i) => (
                            <div className={`risk-item risk-${risk.severity}`} key={i}>
                                <span className="risk-icon">{risk.severity === 'critical' ? '🔴' : '⚠️'}</span>
                                <div className="risk-content">
                                    <span className="risk-category">
                                        {risk.category}
                                        {risk.swedishTerm && (
                                            <span className="risk-swedish">({risk.swedishTerm})</span>
                                        )}
                                    </span>
                                    <span className="risk-desc">{risk.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Pros & Cons */}
            <section className="report-section glass-card animate-in stagger-5">
                <h2 className="section-title">Pros & Cons</h2>
                <div className="proscons-grid">
                    <div className="proscons-col">
                        <h3 className="proscons-heading proscons-pro">✅ Pros</h3>
                        <ul className="proscons-list">
                            {report.pros.map((pro, i) => (
                                <li key={i} className="proscons-item pro-item">{pro}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="proscons-col">
                        <h3 className="proscons-heading proscons-con">❌ Cons</h3>
                        <ul className="proscons-list">
                            {report.cons.map((con, i) => (
                                <li key={i} className="proscons-item con-item">{con}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer metadata */}
            <div className="report-footer animate-in stagger-6">
                <span>Analyzed: {new Date(report.analyzedAt).toLocaleString()}</span>
                <span>Sources: {report.dataSources.join(', ')}</span>
            </div>
        </div>
    );
}
