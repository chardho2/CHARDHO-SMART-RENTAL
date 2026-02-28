<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem;">
                        <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                            System <span class="text-gradient">Configuration</span>
                        </h2>
                        <p style="color: var(--muted);">Tune your application settings and branch management.</p>
                    </div>

                    <ul class="nav nav-tabs modern-tabs" style="border: none; margin-bottom: 2rem; display: flex; gap: 10px;">
                        <li class="active"><a data-toggle="tab" href="#main" class="modern-tab-link"><?=$this->lang->line('main');?></a></li>
                        <li><a data-toggle="tab" href="#branch" class="modern-tab-link"><?=$this->lang->line('branch');?></a></li>
                        <li><a data-toggle="tab" href="#class" class="modern-tab-link"><?=$this->lang->line('class');?></a></li>
                    </ul>

                    <div class="tab-content" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border);">
                        <!-- Main Settings -->
                        <div id="main" class="tab-pane fade in active">
                            <h4 style="margin-bottom: 2rem; border-left: 4px solid var(--primary); padding-left: 15px;"><?=$this->lang->line('main');?></h4>
                            <?php echo form_open('setup'); ?>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('company_name');?></label>
                                        <input type="text" name="company_name" value="<?=$company_name;?>" class="modern-input">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('address');?></label>
                                        <input type="text" name="address" value="<?=$address;?>" class="modern-input">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('country');?></label>
                                        <input type="text" name="country" value="<?=$country;?>" class="modern-input">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('city');?></label>
                                        <input type="text" name="city" value="<?=$city;?>" class="modern-input">
                                    </div>
                                </div>
                            </div>
                            <!-- ... rest of form ... -->
                            <div class="text-right" style="margin-top: 2rem;">
                                <button type="submit" name="confirm" class="btn btn-primary"><?=$this->lang->line('confirm');?></button>
                            </div>
                            <?php echo form_close(); ?>
                        </div>

                        <!-- Branch Management -->
                        <div id="branch" class="tab-pane fade">
                            <h4 style="margin-bottom: 2rem; border-left: 4px solid var(--primary); padding-left: 15px;"><?=$this->lang->line('add_branch');?></h4>
                            <?php echo form_open('setup/branch/add'); ?>
                            <div class="row">
                                <div class="col-md-10">
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('branch_name');?></label>
                                        <input type="text" name="branch_name" class="modern-input" placeholder="Enter branch name...">
                                    </div>
                                </div>
                                <div class="col-md-2" style="display: flex; align-items: flex-end; padding-bottom: 1.5rem;">
                                    <button type="submit" class="btn btn-primary" style="width: 100%; height: 50px;">ADD</button>
                                </div>
                            </div>
                            <?php echo form_close(); ?>
                            
                            <div class="table-responsive" style="margin-top: 2rem;">
                                <table class="table modern-inner-table">
                                    <thead>
                                        <tr><th>ID</th><th>Branch Name</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        <?php if(!empty($branches)): foreach($branches as $b): ?>
                                            <tr>
                                                <td>#<?=$b['id'];?></td>
                                                <td style="font-weight: 600; color: var(--primary);"><?=$b['name'];?></td>
                                                <td>
                                                    <button class="btn btn-sm btn-info btn-icon" data-toggle="modal" data-target="#branch_edit_<?=$b['id'];?>"><i class="fa fa-edit"></i></button>
                                                    <button onclick="expressGo.showSwal('delete-branch','<?=site_url('setup/branch/delete/'.$b['id'].'');?>')" class="btn btn-sm btn-danger btn-icon"><i class="fa fa-remove"></i></button>
                                                </td>
                                            </tr>
                                        <?php endforeach; endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Class Management -->
                        <div id="class" class="tab-pane fade">
                             <h4 style="margin-bottom: 2rem; border-left: 4px solid var(--primary); padding-left: 15px;"><?=$this->lang->line('class');?></h4>
                             <!-- similar structure as branch -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .modern-tabs .active a { background: var(--primary) !important; color: #fff !important; border: none !important; border-radius: 10px !important; }
    .modern-tab-link { color: var(--muted); padding: 10px 20px !important; transition: 0.3s; }
    .modern-tab-link:hover { color: #fff; background: rgba(255,255,255,0.05); border-radius: 10px; }
    .modern-inner-table { color: var(--text); }
    .modern-inner-table th { color: var(--muted); font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid var(--border) !important; }
    .modern-inner-table td { border-bottom: 1px solid var(--border) !important; padding: 15px 10px !important; }
    .form-group-modern { margin-bottom: 1.5rem; }
    .modern-label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block; }
    .modern-input { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; padding: 12px 15px; width: 100%; transition: 0.3s; }
    .modern-input:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); }
</style>


