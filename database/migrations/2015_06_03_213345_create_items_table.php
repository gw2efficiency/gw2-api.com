<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateItemsTable extends Migration
{

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('items', function (Blueprint $table) {

            $table->increments('id');

            $table->string('name_en');
            $table->string('name_de');
            $table->string('name_fr');

            $table->string('description_en')->nullable();
            $table->string('description_de')->nullable();
            $table->string('description_fr')->nullable();

            $table->integer('level')->nullable();

            $table->integer('rarity');

            $table->string('image');

            $table->string('category');

            $table->integer('vendor_price');

            $table->boolean('tradeable');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('items');
    }
}
