<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * @property CI_Loader $load
 * @property CI_Config $config
 * @property Vehicles_Model $Vehicles_Model
 */
class Home extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->helper('url');
    }

    public function index()
    {
        $this->load->model('Vehicles_Model');
        $data['vehicles'] = $this->Vehicles_Model->getVehicles();
        
        // Load the beautiful landing page
        $this->load->view('home_landing_view', $data);
    }
}
