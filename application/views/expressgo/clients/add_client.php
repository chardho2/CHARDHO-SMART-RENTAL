<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-10 col-md-offset-1">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem;">
                        <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                            New <span class="text-gradient">Client</span> Registration
                        </h2>
                        <p style="color: var(--muted);">Register a new customer for your rental service.</p>
                    </div>

                    <?php echo form_open_multipart('clients/add'); ?>
                    
                    <!-- Basic Information -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Basic Information</h5>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('company_name');?></label>
                                <input type="text" name="company_name" value="<?php echo $form_contents['company_name'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('first_name');?></label>
                                <input type="text" name="first_name" value="<?php echo $form_contents['first_name'];?>" class="modern-input">
                                <?php echo form_error('first_name', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('last_name');?></label>
                                <input type="text" name="last_name" value="<?php echo $form_contents['last_name'];?>" class="modern-input">
                                <?php echo form_error('last_name', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('passport_id');?></label>
                                <input type="text" name="passport_id" value="<?php echo $form_contents['passport_id'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('birth_date');?></label>
                                <input type="date" name="birth_date" value="<?php echo $form_contents['birth_date'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('place_of_birth');?></label>
                                <input type="text" name="place_of_birth" value="<?php echo $form_contents['place_of_birth'];?>" class="modern-input">
                            </div>
                        </div>
                    </div>

                    <!-- Contact Details -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Contact & Address</h5>
                        </div>
                        <div class="col-md-8">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('home_address');?></label>
                                <input type="text" name="home_address" value="<?php echo $form_contents['home_address'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('city');?></label>
                                <input type="text" name="city" value="<?php echo $form_contents['city'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('country');?></label>
                                <input type="text" name="country" value="<?php echo $form_contents['country'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('cell_phone');?></label>
                                <input type="text" name="cell_phone" value="<?php echo $form_contents['cell_phone'];?>" class="modern-input">
                                <?php echo form_error('cell_phone', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('e_mail');?></label>
                                <input type="email" name="e_mail" value="<?php echo $form_contents['e_mail'];?>" class="modern-input">
                            </div>
                        </div>
                    </div>

                    <!-- Driver Details -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2.5rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Driver's License Details</h5>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('driving_license');?></label>
                                <input type="text" name="driving_license" value="<?php echo $form_contents['driving_license'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('license_category');?></label>
                                <input type="text" name="license_category" value="<?php echo $form_contents['license_category'];?>" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('license_exp_d');?></label>
                                <input type="date" name="license_exp_d" value="<?php echo $form_contents['license_exp_d'];?>" class="modern-input">
                            </div>
                        </div>
                    </div>

                    <div class="text-right">
                        <button type="submit" name="confirm" class="btn btn-primary" style="padding: 15px 40px; border-radius: 12px; font-weight: 800;">
                            REGISTER CLIENT
                        </button>
                    </div>

                    <?php echo form_close(); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .form-group-modern { margin-bottom: 1.5rem; }
    .modern-label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block; font-weight: 600; }
    .modern-input { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; padding: 12px 15px; width: 100%; transition: 0.3s; font-family: 'Inter'; }
    .modern-input:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 5px; }
</style>