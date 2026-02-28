<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div id="clients-list-root"></div>
            </div>
        </div>
    </div>
</div>

<script type="text/babel">
    const { useState, useEffect } = React;

    const ClientsList = () => {
        const [clients, setClients] = useState(<?php echo json_encode($clients); ?> || []);
        const [searchTerm, setSearchTerm] = useState('');

        const filteredClients = clients.filter(client => 
            client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <div className="glass-panel reveal active" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem' }}>
                            <span className="text-gradient"><?php echo $this->lang->line('clients'); ?></span> Directory
                        </h2>
                        <p style={{ color: 'var(--muted)' }}>Manage your customer database and rental history.</p>
                    </div>
                    <div className="glow-border" style={{ borderRadius: '12px', width: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Search clients..." 
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
                                <th style={{ border: 'none', padding: '10px 20px' }}>#ID</th>
                                <th style={{ border: 'none' }}>Company / Name</th>
                                <th style={{ border: 'none' }}>Birth Date</th>
                                <th style={{ border: 'none' }}>Contact Info</th>
                                <th style={{ border: 'none' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client, idx) => (
                                <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', transition: '0.3s' }} className="car-card-row">
                                    <td style={{ border: 'none', padding: '20px', color: 'var(--muted)' }}>#{client.id}</td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{client.first_name} {client.last_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{client.company_name || 'Individual'}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>{client.birth_date}</td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{client.cell_phone}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{client.e_mail}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a href={`<?php echo site_url('clients/view/'); ?>${client.id}`} className="btn btn-sm btn-success btn-icon">
                                                <i className="fa fa-user"></i>
                                            </a>
                                            <a href={`<?php echo site_url('clients/edit/'); ?>${client.id}`} className="btn btn-sm btn-info btn-icon">
                                                <i className="fa fa-edit"></i>
                                            </a>
                                            <button 
                                                className="btn btn-sm btn-danger btn-icon" 
                                                onClick={() => expressGo.showSwal('delete', `<?php echo site_url('clients/delete/'); ?>${client.id}`)}
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

    const root = ReactDOM.createRoot(document.getElementById('clients-list-root'));
    root.render(<ClientsList />);
</script>

<style>
    .car-card-row:hover {
        background: rgba(255,255,255,0.05) !important;
        transform: translateY(-2px);
    }
</style>

