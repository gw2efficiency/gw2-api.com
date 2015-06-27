<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSpanishAndSkin extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{

		Schema::table('items', function(Blueprint $table)
		{

            $table->string('name_es');
            $table->string('description_es')->nullable();
            $table->integer('skin')->nullable();

		});

	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{

		Schema::table('items', function(Blueprint $table)
		{

            $table->dropColumn('name_es');
            $table->dropColumn('description_es');
            $table->dropColumn('skin');

		});

	}

}
