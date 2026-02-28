<?php defined('BASEPATH') OR exit('Not found'); ?>

<div class="content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-11 col-md-offset-1">
                <div class="glass-panel reveal active" style="padding: 3rem; margin-bottom: 2rem;">
                    
                    <!-- Invoice Header -->
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4rem; border-bottom: 1px solid var(--border); padding-bottom: 2.5rem;">
                        <div>
                            <h2 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.5rem; color: var(--text); margin: 0;">
                                INVOICE <span class="text-gradient">#<?=$invoice_id;?></span>
                            </h2>
                            <p style="color: var(--muted); margin-top: 10px;">Generated for Agreement #<?=$agr_id;?></p>
                        </div>
                        <div style="text-align: right;">
                            <h3 style="font-family: 'Outfit'; font-weight: 700; color: #fff; margin: 0;"><?php echo $e_company_name;?></h3>
                            <p style="color: var(--muted); margin: 5px 0;"><?php echo $e_address;?><br/><?php echo $e_city;?>, <?php echo $e_country;?></p>
                            <p style="color: var(--primary); font-weight: 600;"><?php echo $e_phone;?></p>
                        </div>
                    </div>

                    <!-- Client Info & Summary -->
                    <div class="row" style="margin-bottom: 3rem;">
                        <div class="col-md-6">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">BILL TO</h5>
                            <?php if(!empty($client_info)){ foreach ($client_info as $client) { ?>
                                <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border);">
                                    <h4 style="color: #fff; margin: 0 0 10px 0; font-family: 'Outfit';"><?php echo $client['first_name'] . ' ' . $client['last_name'];?></h4>
                                    <?php if($client['company_name']) echo '<p style="color: var(--muted); margin-bottom: 5px;">'.$client['company_name'].'</p>'; ?>
                                    <p style="color: var(--muted); margin-bottom: 5px;"><?php echo $client['home_address'];?></p>
                                    <p style="color: var(--muted); margin-bottom: 10px;"><?php echo $client['city'];?>, <?php echo $client['country'];?></p>
                                    <p style="color: var(--primary); font-weight: 600; margin: 0;"><?php echo $client['cell_phone'];?></p>
                                </div>
                            <?php } } ?>
                        </div>
                        <div class="col-md-6">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700;">INVOICE TOTALS</h5>
                            <div class="checkout-table" style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2);">
                                <div class="ck-row">
                                    <label>Subtotal</label>
                                    <span><?=$subtotal;?> <?=$currency;?></span>
                                </div>
                                <div class="ck-row">
                                    <label>Tax (<?=$tax;?>%)</label>
                                    <span><?php echo ($total - $subtotal); ?> <?=$currency;?></span>
                                </div>
                                <div class="ck-divider"></div>
                                <div class="ck-row">
                                    <label style="color: #fff; font-weight: 800;">TOTAL</label>
                                    <span style="color: var(--primary); font-size: 1.4rem; font-weight: 900;"><?=$total;?> <?=$currency;?></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payments Table -->
                    <div style="background: rgba(255,255,255,0.01); border-radius: 20px; border: 1px solid var(--border); padding: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h5 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin: 0; font-weight: 700;">Payment History</h5>
                            <div style="display: flex; gap: 10px;">
                                <button data-toggle="modal" data-target="#make_payment" class="btn btn-primary btn-sm">
                                    <i class="fa fa-plus"></i> Add Payment
                                </button>
                                <button data-toggle="modal" data-target="#sale" class="btn btn-warning btn-sm">
                                    <i class="fa fa-percent"></i> Apply Discount
                                </button>
                            </div>
                        </div>

                        <?php echo form_open("/invoices/$invoice_id/payment/delete", array('id' => 'delete-payment')); ?>
                        <div class="table-responsive">
                            <table class="table" style="color: var(--text);">
                                <thead>
                                    <tr style="color: var(--muted); text-transform: uppercase; font-size: 0.7rem; border-bottom: 1px solid var(--border);">
                                        <th style="width: 50px;"></th>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th class="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    $balance_due_calc = array();
                                    if(!empty($payments)){
                                        foreach ($payments as $payment) {
                                            $after_add = $payment['after_add'] == 0 ? "disabled" : NULL;
                                            $balance_due_calc[] = $payment['amount'];
                                    ?>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td>
                                            <input type="checkbox" <?=$after_add;?> value="<?=$payment['id'];?>" name="del_payment[]">
                                        </td>
                                        <td><?=$payment['date'];?></td>
                                        <td><?=$payment['description'];?></td>
                                        <td class="text-right" style="font-weight: 700; color: #fff;"><?=$payment['amount'];?> <?=$currency;?></td>
                                    </tr>
                                    <?php } } ?>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-right" style="padding-top: 2rem; color: var(--muted); font-weight: 600; text-transform: uppercase;">Balance Due</td>
                                        <td class="text-right" style="padding-top: 2rem; color: #ef4444; font-size: 1.4rem; font-weight: 900;">
                                            <?=array_sum($balance_due_calc);?> <?=$currency;?>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <?php echo form_close();?>
                    </div>

                    <!-- Action Buttons -->
                    <div style="margin-top: 3rem; display: flex; gap: 15px; flex-wrap: wrap; justify-content: flex-end;">
                        <button type="submit" onclick="expressGo.showSwal('delete-payment')" class="btn btn-danger" style="border-radius: 12px; opacity: 0.8;">
                            <i class="fa fa-trash"></i> Delete Selected
                        </button>
                        <a href="<?=site_url("/agreement/$agr_id/print");?>" class="btn btn-outline" style="border-radius: 12px; border: 1px solid var(--border);">
                            <i class="fa fa-print"></i> Print Agreement
                        </a>
                        <a href="<?=site_url("/invoices/$invoice_id/print");?>" class="btn btn-outline" style="border-radius: 12px; border: 1px solid var(--border);">
                            <i class="fa fa-file-pdf-o"></i> Print Invoice
                        </a>
                        <button type="button" onclick="expressGo.showSwal('void-invoice','<?=site_url("/invoices/$invoice_id/void");?>')" class="btn btn-outline" style="border-radius: 12px; color: #ef4444; border-color: rgba(239,68,68,0.2);">
                            <i class="fa fa-ban"></i> Void Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Restyling -->
<style>
    .modal-content { background: #1a1a2e !important; border: 1px solid var(--border) !important; border-radius: 24px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important; backdrop-filter: blur(20px); }
    .modal-header { border-bottom: 1px solid var(--border) !important; padding: 25px !important; }
    .modal-title { font-family: 'Outfit'; font-weight: 800; color: #fff !important; }
    .modal-body { padding: 30px !important; }
    .modal-footer { border-top: 1px solid var(--border) !important; padding: 20px !important; }
    .ck-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .ck-row label { color: var(--muted); font-size: 0.85rem; text-transform: uppercase; margin: 0; font-weight: 600; }
    .ck-row span { color: #fff; font-size: 1.1rem; font-weight: 700; font-family: 'Outfit'; }
    .ck-divider { height: 1px; background: var(--border); margin: 20px 0; }
    .close { color: #fff !important; opacity: 0.8 !important; }
</style>

<!-- Add Payment Modal -->
<div id="make_payment" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title"><?=$this->lang->line('make_payment');?></h4>
            </div>
            <div class="modal-body">
                <?php echo form_open("/invoices/$invoice_id/make_payment");?>
                <div class="form-group-modern">
                    <label class="modern-label"><?=$this->lang->line('amount');?></label>
                    <input name="amount" class="modern-input" value="<?=abs(array_sum($balance_due_calc));?>" required style="font-size: 1.5rem; font-weight: 800; text-align: center;"/>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="padding: 15px; font-weight: 800; border-radius: 12px; margin-top: 20px;">
                    <i class="fa fa-check"></i> CONFIRM PAYMENT
                </button>
                <?php echo form_close();?>
            </div>
        </div>
    </div>
</div>

<!-- Sale Modal -->
<div id="sale" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title"><?=$this->lang->line('sale');?></h4>
            </div>
            <div class="modal-body">
                <?php echo form_open("/invoices/$invoice_id/sale");?>
                <div class="form-group-modern">
                    <label class="modern-label"><?=$this->lang->line('percent');?> (%)</label>
                    <input name="percent" class="modern-input" value="" required style="font-size: 1.5rem; font-weight: 800; text-align: center;" placeholder="e.g. 10"/>
                </div>
                <button type="submit" class="btn btn-warning btn-block" style="padding: 15px; font-weight: 800; border-radius: 12px; margin-top: 20px;">
                    <i class="fa fa-percent"></i> APPLY DISCOUNT
                </button>
                <?php echo form_close();?>
            </div>
        </div>
    </div>
</div>

<style>
    .form-group-modern { margin-bottom: 1.5rem; }
    .modern-label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block; font-weight: 600; }
    .modern-input { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; padding: 12px 15px; width: 100%; transition: 0.3s; font-family: 'Inter'; }
    .modern-input:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
</style>