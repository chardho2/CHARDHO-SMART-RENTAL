<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-11 col-md-offset-1">
                <div class="glass-panel reveal active" style="padding: 2.5rem;">
                    
                    <div style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; color: var(--text);">
                                Complete <span class="text-gradient">Agreement</span>
                            </h2>
                            <p style="color: var(--muted);">Step 2: Assign client and finalize rental details</p>
                        </div>
                        <div style="background: rgba(99, 102, 241, 0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border);">
                            <span style="color: var(--primary); font-weight: 700;">STEP 02</span>
                        </div>
                    </div>

                    <?php echo form_open("/agreement/new/finish");?>
                    
                    <!-- Client Selector -->
                    <div class="row" style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <div class="col-md-12">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">Client Selection</h5>
                        </div>
                        <div class="col-md-5">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('company_name');?></label>
                                <input type="text" id="n_agreements_c_name" name="company_name" class="modern-input" placeholder="Search by company...">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('first_name');?></label>
                                <input type="text" name="first_name" id="n_agreements_f_name" class="modern-input" placeholder="First name">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group-modern">
                                <label class="modern-label"><?=$this->lang->line('last_name');?></label>
                                <input name="last_name" id="n_agreements_l_name" type="text" class="modern-input" placeholder="Last name">
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="alert alert-success" id="n_agreements_ok" style="display:none; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; color: #22c55e;">
                                <strong><?=$this->lang->line('selected_client');?>:</strong> <span id="n_agreements_ok_n"></span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-7">
                            <div class="modern-tabs" style="margin-bottom: 2rem;">
                                <ul class="nav nav-tabs" style="border: none; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 5px; display: flex;">
                                    <li class="active" style="flex: 1; text-align: center;"><a data-toggle="tab" href="#drivers_details" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent;">Driver</a></li>
                                    <li style="flex: 1; text-align: center;"><a data-toggle="tab" href="#rental_details" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent;">Deposit</a></li>
                                    <li style="flex: 1; text-align: center;"><a data-toggle="tab" href="#rates_calculation" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent;">Rates</a></li>
                                    <li style="flex: 1; text-align: center;"><a data-toggle="tab" href="#fuel_milage" style="border: none !important; border-radius: 8px; color: var(--muted); background: transparent;">Vehicle</a></li>
                                </ul>
                            </div>

                            <div class="tab-content" style="background: rgba(255,255,255,0.01); border-radius: 16px; min-height: 250px;">
                                <div id="drivers_details" class="tab-pane fade in active" style="padding: 2rem;">
                                    <h5 style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1.5rem; font-weight: 700;"><?=$this->lang->line('drivers_details');?></h5>
                                    <div class="form-group-modern">
                                        <label class="modern-label"><?=$this->lang->line('select_drivers');?></label>
                                        <select class="modern-input" name="driver_id" id="n_client_drivers">
                                            <option>Please select a client first</option>
                                        </select>
                                    </div>
                                </div>

                                <div id="rental_details" class="tab-pane fade" style="padding: 2rem;">
                                    <h5 style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1.5rem; font-weight: 700;"><?=$this->lang->line('rental_details');?></h5>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('deposit_method');?></label>
                                                <select name="deposit_method" class="modern-input">
                                                    <option value="cash"><?=$this->lang->line('cash');?></option>
                                                    <option value="credit_card"><?=$this->lang->line('credit_card');?></option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('deposit_amount');?></label>
                                                <input type="text" id="n_deposit" name="deposit" class="modern-input" placeholder="0.00">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="rates_calculation" class="tab-pane fade" style="padding: 2rem;">
                                    <h5 style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1.5rem; font-weight: 700;"><?=$this->lang->line('rates_calculation');?></h5>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('1day');?></label>
                                                <input type="text" id="n_one_day" name="one_day" value="<?=$r_one_day;?>" class="modern-input">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('weekly');?></label>
                                                <input type="text" id="n_weekly" name="weekly" value="<?=$r_weekly;?>" class="modern-input">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('monthly');?></label>
                                                <input type="text" id="n_monthly" name="monthly" value="<?=$r_monthly;?>" class="modern-input">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="fuel_milage" class="tab-pane fade" style="padding: 2rem;">
                                    <h5 style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 1.5rem; font-weight: 700;"><?=$this->lang->line('fuel_milage');?></h5>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('fuel');?></label>
                                                <input type="text" name="fuel" class="modern-input" placeholder="Level/Scale">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group-modern">
                                                <label class="modern-label"><?=$this->lang->line('odometer');?></label>
                                                <input type="text" name="odometer" class="modern-input" placeholder="Current KM">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Summary / Checkout -->
                        <div class="col-md-5">
                            <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid var(--primary); border-radius: 24px; padding: 2rem;">
                                <h4 style="font-family: 'Outfit'; font-weight: 800; color: #fff; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px;">
                                    <i class="fa fa-shopping-cart text-gradient"></i> Checkout Summary
                                </h4>
                                
                                <div class="checkout-table">
                                    <div class="ck-row">
                                        <label><?=$this->lang->line('total_days');?></label>
                                        <span><?=$total_day;?> Days</span>
                                    </div>
                                    <div class="ck-divider"></div>
                                    <?=$monthly_rate;?>
                                    <?=$weekly_rate;?> 
                                    <?=$daily_rate;?>
                                    <div class="ck-row">
                                        <label><?=$this->lang->line('subtotal');?></label>
                                        <span><span id="n_subtotal_amount"><?=$subtotal_amount;?></span> <?=$currency;?></span>
                                    </div>
                                    <div class="ck-row">
                                        <label><?=$this->lang->line('tax');?></label>
                                        <span><span id="n_tax"><?=$tax;?></span> %</span>
                                    </div>
                                    <div class="ck-row" style="margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 15px;">
                                        <label style="color: #fff; font-size: 1rem; font-weight: 800;">TOTAL AMOUNT</label>
                                        <span style="color: var(--primary); font-size: 1.4rem; font-weight: 900;"><span id="n_total_amount"><?=$total_amount;?></span> <?=$currency;?></span>
                                    </div>
                                    <div class="ck-row" style="opacity: 0.7;">
                                        <label>Amount Due</label>
                                        <span style="font-weight: 700;"><span id="n_amount_due"><?=$total_amount;?></span> <?=$currency;?></span>
                                    </div>
                                </div>

                                <div style="margin-top: 2.5rem;">
                                    <?=$rates_value;?>
                                    <input type="hidden" name="total_day" value="<?=$total_day;?>"/>
                                    <input type="hidden" name="subtotal" value="<?=$subtotal_amount;?>"/>
                                    <input type="hidden" name="total" value="<?=$total_amount;?>"/>
                                    <input type="hidden" name="tax" value="<?=$tax;?>"/>
                                    <input type="hidden" name="from" value="<?=$from;?>"/>
                                    <input type="hidden" name="to" value="<?=$to;?>"/>
                                    <input type="hidden" name="branch_id" value="<?=$branch_id;?>"/>
                                    <input type="hidden" name="vehicle_id" value="<?=$vehicle_id;?>"/>
                                    <input type="hidden" name="client_id" id="client_id" value=""/>   
                                    <button type="submit" name="confirm" onclick="return expressGo.checkAgreement();" class="btn btn-primary btn-block" style="padding: 18px; border-radius: 16px; font-weight: 900; font-size: 1.1rem; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);">
                                        CREATE AGREEMENT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php echo form_close();?>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .form-group-modern { margin-bottom: 1.5rem; }
    .modern-label { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 8px; display: block; font-weight: 600; }
    .modern-input { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; padding: 12px 15px; width: 100%; transition: 0.3s; font-family: 'Inter'; }
    .modern-input:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
    
    .ck-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .ck-row label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin: 0; font-weight: 600; }
    .ck-row span { color: #fff; font-size: 1rem; font-weight: 700; font-family: 'Outfit'; }
    .ck-divider { height: 1px; background: var(--border); margin: 15px 0; border: none; }

    .nav-tabs > li.active > a, .nav-tabs > li.active > a:focus, .nav-tabs > li.active > a:hover {
        background: var(--primary) !important;
        color: #fff !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
</style>