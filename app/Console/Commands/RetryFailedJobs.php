<?php namespace App\Console\Commands;

use App\Console\Command;
use Illuminate\Support\Facades\DB;

class RetryFailedJobs extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:retry-failed-jobs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Retry the jobs that failed (probably because the API was dead)";

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {
        $failed_jobs = DB::table('failed_jobs')->lists('id');

        $this->info('Retrying ' . count($failed_jobs) . ' failed jobs...');

        foreach ($failed_jobs as $job) {
            $this->call('queue:retry', ['id' => $job]);
        }

        $this->info('Done.');
    }
}
