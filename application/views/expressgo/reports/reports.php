<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    <div style="margin-bottom: 2.5rem;">
                        <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                            Analytical <span class="text-gradient">Reports</span>
                        </h2>
                        <p style="color: var(--muted);">Generate detailed insights for your fleet and finances.</p>
                    </div>

                    <?php echo form_open('reports'); ?>
                    <div class="row" style="background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 20px; border: 1px solid var(--border);">
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('report_type');?></label>
                                <select name="report_type" class="modern-input" style="appearance: none;">
                                    <option value=""></option>
                                    <option value="rentals"><?=$this->lang->line('rentals');?></option>
                                    <option value="payments"><?=$this->lang->line('payments');?></option>
                                    <option value="vehicle_list"><?=$this->lang->line('vehicle_list');?></option>
                                    <option value="vehicle_on_rent"><?=$this->lang->line('vehicle_on_rent');?></option>
                                    <option value="vehicle_available"><?=$this->lang->line('vehicle_available');?></option>
                                </select>
                            </div>
                        </div>

                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('start_date');?></label>
                                <input type="date" name="date_from" value="" class="modern-input">
                            </div>
                        </div>

                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('end_date');?></label>
                                <input type="date" name="date_to" value="" class="modern-input">
                            </div>
                        </div>

                        <div class="col-md-2" style="display: flex; align-items: flex-end; padding-bottom: 1.5rem;">
                            <button type="submit" name="confirm" class="btn btn-primary" style="width: 100%; justify-content: center; height: 50px;">
                                <?=$this->lang->line('get_report');?>
                            </button>
                        </div>
                    </div>
                    <?php echo form_close();?>

                    <div style="margin-top: 3rem;">
                        <div className="table-responsive" style="background: rgba(255,255,255,0.02); border-radius: 16px; padding: 1rem;">
                            <?=$result;?>
                        </div>
                    </div>
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



</div>




