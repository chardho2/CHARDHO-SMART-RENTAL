<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-11 col-md-offset-1">
                <?php if(!empty($vehicles)){ foreach($vehicles as $vehicle){ ?>
                <div class="glass-panel reveal active" style="padding: 2.5rem; margin-bottom: 2rem;">
                    
                    <!-- Header with Status -->
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.5rem; color: var(--text); margin: 0;">
                                    <?php echo $vehicle['make'] . ' ' . $vehicle['model']; ?>
                                </h2>
                                <span style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 5px 15px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; border: 1px solid rgba(99, 102, 241, 0.2);">
                                    <?php echo $vehicle['license_plate']; ?>
                                </span>
                            </div>
                            <p style="color: var(--muted); font-size: 1.1rem;"><?php echo $vehicle['year']; ?> • <?php echo $vehicle['color']; ?> • <?php echo $vehicle['class']; ?></p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <a href="<?php echo site_url('vehicles/edit/'.$vehicle['id']); ?>" class="btn btn-primary" style="border-radius: 12px; padding: 12px 25px;">
                                <i class="fa fa-edit"></i> Edit Details
                            </a>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Specs Column -->
                        <div class="col-md-4">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Full Specifications</h5>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>VIN / Chassis</label>
                                    <span><?php echo $vehicle['vin']; ?></span>
                                </div>
                                <div class="detail-item">
                                    <label>Transmission</label>
                                    <span><?php echo $vehicle['transmission']; ?></span>
                                </div>
                                <div class="detail-item">
                                    <label>Engine</label>
                                    <span><?php echo $vehicle['engine']; ?></span>
                                </div>
                                <div class="detail-item">
                                    <label>Fuel Type</label>
                                    <span><?php echo $vehicle['fuel_type']; ?></span>
                                </div>
                                <div class="detail-item">
                                    <label>Home Branch</label>
                                    <span><?php echo $this->expressgo->getBranchName($vehicle['branch_id']); ?></span>
                                </div>
                            </div>
                        </div>

                        <!-- Tabs Column -->
                        <div class="col-md-8">
                            <div class="modern-tabs" style="margin-bottom: 2rem;">
                                <ul class="nav nav-tabs" style="border: none; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 5px;">
                                    <li class="active" style="margin: 0; flex: 1; text-align: center;">
                                        <a data-toggle="tab" href="#pricelist" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent; transition: 0.3s;">Rates Details</a>
                                    </li>
                                    <li style="margin: 0; flex: 1; text-align: center;">
                                        <a data-toggle="tab" href="#rentalhistory" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent; transition: 0.3s;">Rental History</a>
                                    </li>
                                </ul>
                            </div>

                            <div class="tab-content" style="padding: 1rem;">
                                <div id="pricelist" class="tab-pane fade in active">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="rate-card">
                                                <label><?=$this->lang->line('1day');?></label>
                                                <h3><?php echo $vehicle['1day']; ?> <small>pts</small></h3>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="rate-card">
                                                <label><?=$this->lang->line('weekly');?></label>
                                                <h3><?php echo $vehicle['weekly']; ?> <small>pts</small></h3>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="rate-card">
                                                <label><?=$this->lang->line('monthly');?></label>
                                                <h3><?php echo $vehicle['monthly']; ?> <small>pts</small></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="rentalhistory" class="tab-pane fade">
                                    <div class="table-responsive">
                                        <table class="table" style="color: var(--text);">
                                            <thead>
                                                <tr style="color: var(--muted); text-transform: uppercase; font-size: 0.7rem;">
                                                    <th>AGR #</th><th>Client</th><th>Period</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php if(!empty($rental_history)){ foreach ($rental_history as $history) { ?>
                                                <tr>
                                                    <td>#<?=$history['id'];?></td>
                                                    <td>
                                                        <a href="<?php echo site_url('clients/view/'.$history['client_id'].''); ?>" style="color: var(--primary); font-weight: 600;">
                                                            <?=$history['first_name'];?> <?=$history['last_name'];?>
                                                        </a>
                                                    </td>
                                                    <td style="font-size: 0.85rem;">
                                                        <?=$history['date_from'];?> <br/>
                                                        <span style="color: var(--muted);">to</span> <?=$history['date_to'];?>
                                                    </td>
                                                </tr>
                                                <?php } } else { ?>
                                                    <tr><td colspan="3" class="text-center" style="color: var(--muted); padding: 2rem;">No rental history found.</td></tr>
                                                <?php } ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <?php } } ?>
            </div>
        </div>
    </div>
</div>

<style>
    .detail-item { margin-bottom: 1.5rem; transition: 0.3s; }
    .detail-item label { display: block; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px; }
    .detail-item span { display: block; color: #fff; font-size: 1.1rem; font-weight: 500; font-family: 'Outfit'; }
    
    .rate-card { background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); text-align: center; }
    .rate-card label { display: block; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 10px; }
    .rate-card h3 { margin: 0; font-family: 'Outfit'; font-weight: 800; color: #fff; }
    .rate-card h3 small { font-size: 0.9rem; font-weight: 400; color: var(--muted); }

    .nav-tabs > li.active > a, .nav-tabs > li.active > a:focus, .nav-tabs > li.active > a:hover {
        background: var(--primary) !important;
        color: #fff !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
</style>

