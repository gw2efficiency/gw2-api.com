<?php namespace App\Console\Commands;

use App\Events\PvpLeaderboardUpdated;
use App\Console\Command;
use Event;
use Exception;
use Illuminate\Support\Facades\Redis;

class UpdatePvpLeaderboard extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-pvp-leaderboard';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Update the leaderboard with the official leaderboard";

    public static $key = 'leaderboard';

    private static $pages = 40;

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        $this->infoStart('Parsing EU leaderboard...');
        $eu_rankings = $this->parseLeaderboard('eu');
        $this->infoFinish('Done parsing!');

        $this->infoStart('Parsing NA leaderboard...');
        $na_rankings = $this->parseLeaderboard('na');
        $this->infoFinish('Done parsing!');

        Redis::set(self::$key, serialize([
            'eu' => $eu_rankings,
            'na' => $na_rankings
        ]));

        // Trigger an event for post-processor to hook into
        Event::fire(new PvpLeaderboardUpdated());

    }

    private function parseLeaderboard($region)
    {

        $rankings = [];

        for ($i = 1; $i <= self::$pages; $i++) {

            $content = $this->getContent('https://leaderboards.guildwars2.com/en/' . $region . '/pvp?page=' . $i . '&pjax=1');
            preg_match_all('/<tr.*<\/tr>/Us', $content, $rows);

            foreach ($rows[0] as $row) {

                if (strpos($row, '</th>') !== false) {
                    continue;
                }

                preg_match_all('/<td.*<\/td>/Us', $row, $cells);
                $cells = $cells[0];

                $element = [
                    'rank' => (int) $this->parseInnerText($cells[0]),
                    'points' => (int) $this->parseInnerText($cells[1]),
                    'name' => trim(strip_tags($cells[2])),
                    'charname' => trim(strip_tags($cells[3])),
                    'wins' => (int) $this->parseInnerText($cells[4]),
                    'losses' => (int) $this->parseInnerText($cells[5]),
                ];

                $rankings[$element['rank']] = $element;

            }

        }

        return array_values($rankings);

    }

    private function getContent($url, $try = 0)
    {

        try {

            $content = file_get_contents($url);
            return $content;

        } catch (Exception $e) {

            if ($try == 3) {
                throw new Exception('Getting content from URL failed: ' . $e->getMessage());
            }

            sleep(10);
            return $this->getContent($url, ++$try);

        }

    }

    /**
     * @param $cell
     * @return int
     */
    private function parseInnerText($cell)
    {
        return trim(preg_replace('/^.*<span class="cell-inner after-arrow">(.*)<\/span>.*$/Us', '$1', $cell));
    }

}