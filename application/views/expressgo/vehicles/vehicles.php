<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div id="vehicles-list-root"></div>
            </div>
        </div>
    </div>
</div>

<script type="text/babel">
    const { useState, useEffect } = React;

    const VehiclesList = () => {
        const [vehicles, setVehicles] = useState(<?php echo json_encode($vehicles); ?> || []);
        const [searchTerm, setSearchTerm] = useState('');

        const filteredVehicles = vehicles.filter(v => 
            v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="glass-panel reveal active" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem' }}>
                            <span className="text-gradient"><?php echo $this->lang->line('vehicles'); ?></span> Fleet
                        </h2>
                        <p style={{ color: 'var(--muted)' }}>Monitor and manage your vehicle inventory.</p>
                    </div>
                    <div className="glow-border" style={{ borderRadius: '12px', width: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Search vehicles..." 
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
                                <th style={{ border: 'none', padding: '10px 20px' }}>Plate No.</th>
                                <th style={{ border: 'none' }}>Make & Model</th>
                                <th style={{ border: 'none' }}>Year</th>
                                <th style={{ border: 'none' }}>Color</th>
                                <th style={{ border: 'none' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map((v, idx) => (
                                <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', transition: '0.3s' }} className="car-card-row">
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                                            {v.license_plate}
                                        </span>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{v.make}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{v.model}</div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>{v.year}</td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.color.toLowerCase(), border: '1px solid var(--border)' }}></div>
                                            {v.color}
                                        </div>
                                    </td>
                                    <td style={{ border: 'none', padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a href={`<?php echo site_url('vehicles/view/'); ?>${v.id}`} className="btn btn-sm btn-success btn-icon">
                                                <i className="fa fa-car"></i>
                                            </a>
                                            <a href={`<?php echo site_url('vehicles/edit/'); ?>${v.id}`} className="btn btn-sm btn-info btn-icon">
                                                <i className="fa fa-edit"></i>
                                            </a>
                                            <button 
                                                className="btn btn-sm btn-danger btn-icon" 
                                                onClick={() => expressGo.showSwal('delete', `<?php echo site_url('vehicles/delete/'); ?>${v.id}`)}
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

    const root = ReactDOM.createRoot(document.getElementById('vehicles-list-root'));
    root.render(<VehiclesList />);
</script>

<style>
    .car-card-row:hover {
        background: rgba(255,255,255,0.05) !important;
        transform: translateY(-2px);
    }
</style>

