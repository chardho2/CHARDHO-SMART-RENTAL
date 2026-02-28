<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div id="agreements-list-root"></div>
            </div>
        </div>
    </div>
</div>

<script type="text/babel">
    const { useState, useEffect } = React;

    const AgreementsList = () => {
        const [agreements, setAgreements] = useState(<?php echo json_encode($agreements); ?> || []);
        const [searchTerm, setSearchTerm] = useState('');

        const filteredAgreements = agreements.filter(a => 
            a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.model.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="glass-panel reveal active" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem' }}>
                            <span className="text-gradient"><?php echo $this->lang->line('agreements'); ?></span> History
                        </h2>
                        <p style={{ color: 'var(--muted)' }}>Track all rental agreements, payments, and status.</p>
                    </div>
                    <div className="glow-border" style={{ borderRadius: '12px', width: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Search agreements..." 
                            className="modern-input"
                            style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', width: '100%' }}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table" style={{ color: 'var(--text)', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                <th style={{ border: 'none', padding: '10px 20px' }}>Date</th>
                                <th style={{ border: 'none' }}>Client</th>
                                <th style={{ border: 'none' }}>Vehicle Details</th>
                                <th style={{ border: 'none' }}>Status</th>
                                <th style={{ border: 'none' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgreements.map((a, idx) => (
                                <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', transition: '0.3s' }} className="car-card-row">
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ fontWeight: 600 }}>{a.agreement_date}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{a.agreement_id}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{a.first_name} {a.last_name}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div>{a.make} {a.model}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        {a.status == 1 ? (
                                            <span style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>PAID</span>
                                        ) : a.status == 0 ? (
                                            <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>UNPAID</span>
                                        ) : (
                                            <span style={{ color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>VOID</span>
                                        )}
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a href={`<?php echo site_url('/invoices/'); ?>${a.invoice_id}`} className="btn btn-sm btn-success btn-icon" title="View Invoice">
                                                <i className="fa fa-file-text-o"></i>
                                            </a>
                                            <a href={`<?php echo site_url('/agreement/view/'); ?>${a.agreement_id}`} className="btn btn-sm btn-info btn-icon" title="View Agreement">
                                                <i className="fa fa-eye"></i>
                                            </a>
                                            <button 
                                                className="btn btn-sm btn-danger btn-icon" 
                                                onClick={() => expressGo.showSwal('agreement-delete', `<?php echo site_url('agreement/delete/'); ?>${a.agreement_id}`)}
                                                title="Delete"
                                            >
                                                <i className="fa fa-remove"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const root = ReactDOM.createRoot(document.getElementById('agreements-list-root'));
    root.render(<AgreementsList />);
</script>

<style>
    .car-card-row:hover {
        background: rgba(255,255,255,0.05) !important;
        transform: translateY(-2px);
    }
</style>

