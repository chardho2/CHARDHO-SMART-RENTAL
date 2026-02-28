<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem;">
                        <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                            User <span class="text-gradient">Profile</span>
                        </h2>
                        <p style="color: var(--muted);">Manage your account security and authentication details.</p>
                    </div>

                    <div style="margin-bottom: 2rem; color: #ef4444;"><?=$alert;?></div>

                    <?php echo form_open('/profile'); ?>
                    
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group-modern">
                                <label class="modern-label">Login Username</label>
                                <input type="text" value="admin" class="modern-input" style="background: rgba(255,255,255,0.02); color: var(--muted);" disabled>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('new_password');?></label>
                                <input type="password" name="new_password" class="modern-input" placeholder="Enter new password">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('confirm_password');?></label>
                                <input type="password" name="confirm_password" class="modern-input" placeholder="Confirm new password">
                            </div>
                        </div>
                    </div>

                    <div class="text-right" style="margin-top: 2rem;">
                        <button type="submit" name="confirm" class="btn btn-primary" style="padding: 12px 30px;">
                            <?=$this->lang->line('confirm');?>
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
    .modern-label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block; }
    .modern-input { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; padding: 12px 15px; width: 100%; transition: 0.3s; }
    .modern-input:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); }
</style>

 




