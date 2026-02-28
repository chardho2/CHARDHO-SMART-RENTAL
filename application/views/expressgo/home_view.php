<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row" style="margin-bottom: 2rem;">
            <div class="col-lg-3 col-sm-6">
                <div class="glass-panel reveal active" style="padding: 1.5rem; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(34, 197, 94, 0.1); width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #22c55e;">
                        <i class="ti-wallet" style="font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <p style="color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;"><?=$this->lang->line('vehicle_on_rent');?></p>
                        <h3 style="margin: 0; font-family: 'Outfit'; font-weight: 800; font-size: 1.8rem;"><?=$OnRentsCount;?></h3>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-sm-6">
                <div class="glass-panel reveal active" style="padding: 1.5rem; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(239, 68, 68, 0.1); width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                        <i class="ti-pulse" style="font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <p style="color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;"><?=$this->lang->line('vehicle_available');?></p>
                        <h3 style="margin: 0; font-family: 'Outfit'; font-weight: 800; font-size: 1.8rem;"><?=$AvailableVehicle;?></h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div id="fleet-dashboard-root"></div>
            </div>
        </div>
    </div>
</div>

<script type="text/babel">
    const { useState, useEffect } = React;

    const FleetDashboard = () => {
        // Live data from PHP
        const [rentals, setRentals] = useState(<?php echo json_encode($onRents); ?> || []);
        const [searchTerm, setSearchTerm] = useState('');

        const filteredRentals = rentals.filter(item => 
            item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.model.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="glass-panel reveal active" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem' }}>
                            <span className="text-gradient">Active Fleet</span> Reservations
                        </h2>
                        <p style={{ color: 'var(--muted)' }}>Manage live rentals and monitor vehicle status in real-time.</p>
                    </div>
                    <div className="glow-border" style={{ borderRadius: '12px', width: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Search by name, plate, or model..." 
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
                                <th style={{ border: 'none', padding: '10px 20px' }}>Customer</th>
                                <th style={{ border: 'none' }}>Contact</th>
                                <th style={{ border: 'none' }}>Vehicle Details</th>
                                <th style={{ border: 'none' }}>Period</th>
                                <th style={{ border: 'none' }}>Status</th>
                                <th style={{ border: 'none' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRentals.map((item, idx) => {
                                const isExpired = new Date(item.date_to) < new Date();
                                return (
                                    <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', transition: '0.3s' }} className="car-card-row">
                                        <td style={{ border: 'none', padding: '20px', fontWeight: 600 }}>{item.first_name} {item.last_name}</td>
                                        <td style={{ border: 'none', padding: '20px', color: 'var(--muted)' }}>{item.cell_phone}</td>
                                        <td style={{ border: 'none', padding: '20px' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.make} {item.model}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.license_plate}</div>
                                        </td>
                                        <td style={{ border: 'none', padding: '20px' }}>
                                            <div style={{ fontSize: '0.85rem' }}>{item.date_from.split(' ')[0]}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>to {item.date_to.split(' ')[0]}</div>
                                        </td>
                                        <td style={{ border: 'none', padding: '20px' }}>
                                            {isExpired ? (
                                                <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>
                                                    OVERDUE
                                                </span>
                                            ) : (
                                                <span style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>
                                                    ON TRIP
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ border: 'none', padding: '20px' }}>
                                            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
                                                Check In
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const root = ReactDOM.createRoot(document.getElementById('fleet-dashboard-root'));
    root.render(<FleetDashboard />);
</script>

<style>
    .car-card-row:hover {
        background: rgba(255,255,255,0.05) !important;
        transform: scale(1.01);
                                                 }
</style>