<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddCraftableFlag extends Migration
{

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {

        Schema::table('items', function (Blueprint $table) {

            $table->boolean('craftable');

        });

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {

        Schema::table('items', function (Blueprint $table) {

            $table->dropColumn('craftable');

        });

    }

}
