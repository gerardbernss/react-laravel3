<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Yajra\Oci8\Schema\Grammars\OracleGrammar;
use Illuminate\Database\Schema\ColumnDefinition;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Oracle does not have a YEAR type; store as NUMBER(4)
        OracleGrammar::macro('typeYear', function (ColumnDefinition $column) {
            return 'number(4)';
        });
    }
}
