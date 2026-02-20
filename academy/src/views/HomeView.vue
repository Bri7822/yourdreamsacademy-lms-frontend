<script setup>
import Home from '../components/home/Home.vue'

$(document).ready(function() {
      // Form switching logic
      $('.form-switch-link').on('click', function(e) {
        e.preventDefault();
        const targetForm = $(this).data('target');
        $('.form-transition').addClass('form-hidden');
        $(`#${targetForm}`).removeClass('form-hidden');
      });

      // Password visibility toggle
      $('.toggle-password').on('click', function() {
        const target = $(this).data('target');
        const input = $(`#${target}`);
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
      });

      // Role selection
      $('.role-selector').on('click', function() {
        $('.role-selector').removeClass('active');
        $(this).addClass('active');
        $('#user_role').val($(this).data('role'));
      });

      // Form validation
      $('#register_form').on('submit', function(e) {
        e.preventDefault();
        const password = $('#signup_password').val();
        const confirmPassword = $('#confirm_password').val();

        if (password !== confirmPassword) {
          alert('Passwords do not match!');
          return false;
        }

        // Add your registration logic here
        console.log('Registration submitted');
      });

      $('#signin_form').on('submit', function(e) {
        e.preventDefault();
        // Add your login logic here
        console.log('Login submitted');
      });
    });

</script>

<template>
  <main>
    <Home />
  </main>
</template>
