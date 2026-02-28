<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-10 col-md-offset-1">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem;">
                        <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                            Add <span class="text-gradient">Vehicle</span> to Fleet
                        </h2>
                        <p style="color: var(--muted);">Expand your inventory by registering a new vehicle.</p>
                    </div>

                    <?php echo form_open_multipart('vehicles/add'); ?>
                    
                    <!-- Vehicle Specifications -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Specifications</h5>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('license_plate');?></label>
                                <input type="text" value="<?php echo $form_contents['license_plate'];?>" name="license_plate" class="modern-input">
                                <?php echo form_error('license_plate', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('vin');?></label>
                                <input type="text" value="<?php echo $form_contents['vin'];?>" name="vin" class="modern-input">
                                <?php echo form_error('vin', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('make');?></label>
                                <input type="text" value="<?php echo $form_contents['make'];?>" name="make" class="modern-input">
                                <?php echo form_error('make', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('model');?></label>
                                <input type="text" value="<?php echo $form_contents['model'];?>" name="model" class="modern-input">
                                <?php echo form_error('model', '<div class="error-msg">', '</div>'); ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('year');?></label>
                                <input type="text" value="<?php echo $form_contents['year'];?>" name="year" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('color');?></label>
                                <input type="text" value="<?php echo $form_contents['color'];?>" name="color" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('class');?></label>
                                <select name="class" class="modern-input">
                                    <?php if(!empty($vehicle_class)){ foreach($vehicle_class as $_vehicle_class){ ?>
                                        <option value="<?=$_vehicle_class['name'];?>"><?=$_vehicle_class['name'];?></option>
                                    <?php } }?>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('transmission');?></label>
                                <select name="transmission" class="modern-input">
                                    <option>Automatic</option>
                                    <option>Manual</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('fuel_type');?></label>
                                <select name="fuel_type" class="modern-input">
                                    <option>Gasoline</option>
                                    <option>Diesel</option>
                                    <option>Gas</option>
                                    <option>Electric</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('branch');?></label>
                                <select name="branch_id" class="modern-input">
                                    <?php if(!empty($branch)){ foreach($branch as $_branch){ ?>
                                        <option value="<?=$_branch['id'];?>"><?=$_branch['name'];?></option>
                                    <?php } }?>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Rental Rates -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2.5rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Rental Rates (<?=$currency;?>)</h5>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('1day');?></label>
                                <input value="<?php echo $form_contents['1day'];?>" name="1day" type="text" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('weekly');?></label>
                                <input value="<?php echo $form_contents['weekly'];?>" name="weekly" type="text" class="modern-input">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('monthly');?></label>
                                <input value="<?php echo $form_contents['monthly'];?>" name="monthly" type="text" class="modern-input">
                            </div>
                        </div>
                    </div>

                    <div class="text-right">
                        <button type="submit" name="confirm" class="btn btn-primary" style="padding: 15px 40px; border-radius: 12px; font-weight: 800;">
                            CONFIRM VEHICLE
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
    select.modern-input option { background: #111827; color: #fff; }
</style>

