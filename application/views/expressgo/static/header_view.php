<?php defined('BASEPATH') OR exit ('Not Found'); ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" sizes="96x96" href="<?php echo base_url('public/'); ?>assets/img/favicon.png">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

    <title><?php echo $title; ?></title>

    <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' name='viewport' />
    <meta name="viewport" content="width=device-width" />

    <!-- Bootstrap core CSS     -->
    <link href="<?php echo base_url('public/'); ?>assets/css/bootstrap.min.css" rel="stylesheet" />
    <link href="<?php echo base_url('public/'); ?>assets/css/bootstrap-table.css" rel="stylesheet" />

    <!-- Animation library for notifications   -->
    <link href="<?php echo base_url('public/'); ?>assets/css/animate.min.css" rel="stylesheet"/>

    <!--  Paper Dashboard core CSS    -->
    <link href="<?php echo base_url('public/'); ?>assets/css/paper-dashboard.css" rel="stylesheet"/>
    
    <link href="<?php echo base_url('public/'); ?>assets/autocomplete/easy-autocomplete.min.css" rel="stylesheet"/>
    <link href="<?php echo base_url('public/'); ?>assets/autocomplete/easy-autocomplete.themes.min.css" rel="stylesheet"/>

     <!-- default css-->
    <link href="<?php echo base_url('public/'); ?>assets/css/expressgo.css" rel="stylesheet" />

    <!--  Fonts and icons     -->
    <link href="<?php echo base_url('public/'); ?>assets/css/font-awesome.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="<?php echo base_url('public/'); ?>assets/css/themify-icons.css" rel="stylesheet">
    
    <!-- Modern Design System -->
    <link href="<?php echo base_url('public/'); ?>assets/css/modern_design.css" rel="stylesheet" />
    <link href="<?php echo base_url('public/'); ?>assets/css/chardho_main.css" rel="stylesheet" />
    
    <!-- Scripts -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="modern-theme">

    <div class="wrapper">
        <div class="sidebar modern-sidebar">
            <div class="sidebar-wrapper">
                <div class="logo" style="border: none; padding: 30px 20px;">
                    <a href="<?php echo site_url('/'); ?>" class="simple-text" style="font-family: 'Outfit'; font-weight: 800; font-size: 1.5rem; text-transform: none; letter-spacing: -1px;">
                        <span class="text-gradient">Chardho</span> Go
                    </a>
                </div>

                <ul class="nav">
                    <li class="<?=($this->uri->segment(1) == "dashboard") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/dashboard'); ?>">
                            <i data-lucide="layout-dashboard"></i>
                            <p><?=$this->lang->line('dashboard');?></p>
                        </a>
                    </li>
                    <li class="<?=($this->uri->segment(1) == "clients") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/clients'); ?>">
                            <i data-lucide="users"></i>
                            <p><?=$this->lang->line('clients');?></p>
                        </a>
                    </li>
                    <li class="<?=($this->uri->segment(1) == "vehicles") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/vehicles'); ?>">
                            <i data-lucide="car"></i>
                            <p><?=$this->lang->line('vehicles');?></p>
                        </a>
                    </li>
                    <li class="<?=($this->uri->segment(1) == "agreement") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/agreement'); ?>">
                            <i data-lucide="file-text"></i>
                            <p><?=$this->lang->line('agreement');?></p>
                        </a>
                    </li>
                    <li class="<?=($this->uri->segment(1) == "reports") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/reports'); ?>">
                            <i data-lucide="bar-chart-3"></i>
                            <p><?=$this->lang->line('reports');?></p>
                        </a>
                    </li>
                    <li class="<?=($this->uri->segment(1) == "setup") ? "active" : "" ?>">
                        <a href="<?php echo site_url('/setup'); ?>">
                            <i data-lucide="settings"></i>
                            <p><?=$this->lang->line('setup');?></p>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="main-panel">
            <nav class="navbar modern-navbar">
                <div class="container-fluid">
                    <div class="navbar-header">
                        <button type="button" class="navbar-toggle">
                            <span class="sr-only">Toggle navigation</span>
                            <span class="icon-bar bar1"></span>
                            <span class="icon-bar bar2"></span>
                            <span class="icon-bar bar3"></span>
                        </button>
                        <a class="navbar-brand" style="font-family: 'Outfit'; font-weight: 700; color: #fff;"><?php echo $title; ?></a>
                    </div>
                    <div class="collapse navbar-collapse">
                        <ul class="nav navbar-nav navbar-right">
                            <li>
                                <div style="display: flex; gap: 10px; padding: 10px 0;">
                                    <a href="<?php echo site_url('/clients/add'); ?>" class="modern-nav-btn">
                                        <i data-lucide="user-plus"></i> Client
                                    </a>
                                    <a href="<?php echo site_url('/vehicles/add'); ?>" class="modern-nav-btn">
                                        <i data-lucide="plus-circle"></i> Vehicle
                                    </a>
                                    <a href="<?php echo site_url('/agreement/new'); ?>" class="modern-nav-btn btn-primary" style="background: var(--primary) !important; color: #fff !important;">
                                        <i data-lucide="rocket"></i> New Agreement
                                    </a>
                                </div>
                            </li>
                            <li class="dropdown">
                                <a href="#profile" class="dropdown-toggle" data-toggle="dropdown" style="padding-top: 15px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: #fff;">AD</div>
                                        <span style="color: #fff; font-weight: 600;">Administrator</span>
                                        <b class="caret"></b>
                                    </div>
                                </a>
                                <ul class="dropdown-menu modern-dropdown">
                                    <li><a href="<?php echo site_url('/profile'); ?>"><i data-lucide="user"></i> <?=$this->lang->line('profile');?></a></li>
                                    <li class="divider" style="background: rgba(255,255,255,0.05);"></li>
                                    <li><a href="<?php echo site_url('/logout'); ?>" style="color: #ef4444;"><i data-lucide="log-out"></i> <?=$this->lang->line('logout');?></a></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            
            <script>
                // Initialize Lucide icons
                lucide.createIcons();
            </script>

