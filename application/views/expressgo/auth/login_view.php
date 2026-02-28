<?php defined('BASEPATH') OR exit ('Not Found'); ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" sizes="96x96" href="<?php echo base_url('public/'); ?>assets/img/favicon.png">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

    <title>Login | Chardho Car Rental</title>

    <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' name='viewport' />
    <meta name="viewport" content="width=device-width" />

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Design System -->
    <link href="<?php echo base_url('public/'); ?>assets/css/modern_design.css" rel="stylesheet" />

    <!-- Google Identity Services SDK -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <style>
        .divider {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1.8rem 0;
            color: var(--text-muted);
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }
        .divider::before, .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }
        .google-btn-wrap {
            display: flex;
            justify-content: center;
        }
        .login-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 0.5rem;
        }
        .login-brand-logo {
            width: 40px;
            height: 40px;
            background: #f82b2b;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 0 20px rgba(248, 43, 43, 0.4);
        }
        .login-brand-name {
            font-family: 'Outfit', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #fff 0%, #f82b2b 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body class="login-bg">

    <div class="modern-card login-card">
        <!-- Brand Header -->
        <div class="login-card-header">
            <div class="login-brand">
                <div class="login-brand-logo">⚡</div>
                <div class="login-brand-name">CHARDHO</div>
            </div>
            <h2 style="font-size: 1.4rem; margin-top: 1rem; font-weight: 700;">Welcome Back</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">Sign in to manage your fleet.</p>
        </div>

        <!-- ── Google Sign-In Button ── -->
        <div class="google-btn-wrap">
            <div id="g_id_onload"
                data-client_id="<?php echo defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : ''; ?>"
                data-callback="handleGoogleCredential"
                data-auto_prompt="false">
            </div>
            <div class="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="filled_black"
                data-text="signin_with"
                data-size="large"
                data-logo_alignment="left"
                data-width="340">
            </div>
        </div>

        <div class="divider">or continue with username</div>

        <!-- ── Username / Password Form ── -->
        <?php echo form_open("/login");?>
            <span style="display: block; margin-bottom: 1rem; text-align: center;"><?=$alert;?></span>
            
            <div class="form-group-modern">
                <label class="modern-label"><?=$this->lang->line('username');?></label>
                <input type="text" name="login" placeholder="Enter your username" class="modern-input" required>
            </div>

            <div class="form-group-modern">
                <label class="modern-label"><?=$this->lang->line('password');?></label>
                <input type="password" name="password" placeholder="••••••••" class="modern-input" required>
            </div>

            <div style="margin-top: 2rem;">
                <button type="submit" name="loginF" class="modern-btn modern-btn-primary" style="width: 100%; justify-content: center;">
                    <?=$this->lang->line('login');?>
                </button>
            </div>
        <?php echo form_close();?>
    </div>

    <script>
        /**
         * Called by Google GSI after user picks their Google account.
         * Sends the signed JWT (ID token) to our PHP backend for verification.
         */
        function handleGoogleCredential(response) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '<?php echo site_url("auth/google_callback"); ?>';

            const credInput = document.createElement('input');
            credInput.type  = 'hidden';
            credInput.name  = 'credential';
            credInput.value = response.credential;
            form.appendChild(credInput);

            document.body.appendChild(form);
            form.submit();
        }
    </script>

</body>
</html>
