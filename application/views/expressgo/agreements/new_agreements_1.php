<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-10 col-md-offset-1">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                                New <span class="text-gradient">Agreement</span>
                            </h2>
                            <p style="color: var(--muted);">Step 1: Select duration and available vehicle</p>
                        </div>
                        <div style="background: rgba(99, 102, 241, 0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border);">
                            <span style="color: var(--primary); font-weight: 700;">STEP 01</span>
                        </div>
                    </div>

                    <?php echo form_open_multipart('agreement/new/step2'); ?>
                    
                    <div class="row" style="margin-bottom: 2rem;">
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('start_date');?></label>
                                <input type="date" id="n_from" name="from" value="" class="modern-input">
                                <?php echo form_error('from', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('end_date');?></label>
                                <input type="date" min="" id="n_to" name="to" value="" class="modern-input">
                                <?php echo form_error('to', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('branch');?></label>
                                <select name="branch" id="n_agreements_branch" class="modern-input">
                                    <option value="0">Select Branch</option>
                                    <?php if(!empty($branch)){ foreach($branch as $_branch){ ?>
                                        <option value="<?=$_branch['id'];?>"><?=$_branch['name'];?></option>
                                    <?php } }?>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2.5rem;">
                        <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Available Vehicles</h5>
                        
                        <div class="table-responsive">
                            <table class="table" id="n_agreements_vehicles" style="color: var(--text);">
                                <thead>
                                    <tr style="color: var(--muted); text-transform: uppercase; font-size: 0.7rem; border-bottom: 1px solid var(--border);">
                                        <th>#</th>
                                        <th><?=$this->lang->line('license_plate');?></th>
                                        <th><?=$this->lang->line('make_model');?></th>
                                        <th><?=$this->lang->line('year');?></th>
                                        <th><?=$this->lang->line('class');?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="5" class="text-center" style="padding: 3rem; color: var(--muted);">
                                            Please select dates and branch to see available vehicles
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <input type="hidden" name="vehicle_id" id="vehicle_id"/>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary" style="padding: 15px 40px; border-radius: 12px; font-weight: 800;">
                            CONTINUE TO NEXT STEP <i class="fa fa-arrow-right" style="margin-left: 10px;"></i>
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
    #n_agreements_vehicles tr.selected { background: rgba(99, 102, 241, 0.2); }
    #n_agreements_vehicles tr { cursor: pointer; transition: 0.2s; }
    #n_agreements_vehicles tr:hover:not(.selected) { background: rgba(255,255,255,0.05); }
</style>

