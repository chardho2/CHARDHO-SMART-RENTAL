<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-10 col-md-offset-1">
                <?php if(!empty($clients)){ foreach($clients as $client){ ?>
                <div class="glass-panel reveal active" style="padding: 2.5rem; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;">
                        <div>
                            <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                                Client <span class="text-gradient">#<?php echo $client['id']; ?></span>
                            </h2>
                            <p style="color: var(--muted);"><?php echo $client['first_name'] . ' ' . $client['last_name']; ?></p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <a href="<?php echo site_url('clients/edit/'.$client['id']); ?>" class="btn btn-outline" style="border-radius: 12px; padding: 10px 20px;">
                                <i class="fa fa-edit"></i> Edit Profile
                            </a>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Personal Info -->
                        <div class="col-md-6">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Personal Information</h5>
                            <div class="detail-group">
                                <label><?=$this->lang->line('company_name');?></label>
                                <span><?php echo $client['company_name'] ?: 'N/A'; ?></span>
                            </div>
                            <div class="detail-group">
                                <label><?=$this->lang->line('passport_id');?></label>
                                <span><?php echo $client['passport_id']; ?></span>
                            </div>
                            <div class="detail-group">
                                <label><?=$this->lang->line('birth_date');?></label>
                                <span><?php echo $client['birth_date']; ?></span>
                            </div>
                            <div class="detail-group">
                                <label><?=$this->lang->line('place_of_birth');?></label>
                                <span><?php echo $client['place_of_birth']; ?></span>
                            </div>
                        </div>

                        <!-- Contact Info -->
                        <div class="col-md-6">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Contact Details</h5>
                            <div class="detail-group">
                                <label><?=$this->lang->line('cell_phone');?></label>
                                <span style="font-weight: 700; color: #fff;"><?php echo $client['cell_phone']; ?></span>
                            </div>
                            <div class="detail-group">
                                <label><?=$this->lang->line('e_mail');?></label>
                                <span><?php echo $client['e_mail']; ?></span>
                            </div>
                            <div class="detail-group">
                                <label><?=$this->lang->line('home_address');?></label>
                                <span><?php echo $client['home_address'] . ', ' . $client['city'] . ', ' . $client['country']; ?></span>
                            </div>
                        </div>
                    </div>

                    <?php if(!empty($drivers)){ foreach($drivers as $driver){ ?>
                    <div class="row" style="margin-top: 3rem; background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border);">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Driver's License details</h5>
                        </div>
                        <div class="col-md-4">
                            <div class="detail-group">
                                <label>Driver Name</label>
                                <span><?php echo $driver['first_name'] . ' ' . $driver['last_name']; ?></span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="detail-group">
                                <label><?=$this->lang->line('driving_license');?></label>
                                <span><?php echo $driver['driving_license']; ?></span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="detail-group">
                                <label><?=$this->lang->line('license_exp_d');?></label>
                                <span style="color: #ef4444;"><?php echo $driver['license_exp']; ?></span>
                            </div>
                        </div>
                    </div>
                    <?php } } ?>
                </div>
                <?php } } ?>
            </div>
        </div>
    </div>
</div>

<style>
    .detail-group { margin-bottom: 1.2rem; }
    .detail-group label { display: block; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px; }
    .detail-group span { display: block; color: #f3f4f6; font-size: 1rem; font-family: 'Inter'; }
</style>
