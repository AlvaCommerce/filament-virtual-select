<?php

namespace Alva\FilamentVirtualSelect\Forms\Concerns;

use Closure;

trait HasOptionAlias
{
    /**
     * Aliases let a search match tokens that are not adjacent in the label
     *
     * They are ordered subsequences of the label's words, so the count grows as
     * 2^words. The cap keeps a pathological label (a pasted address, a long
     * compound name) from generating hundreds of thousands of strings, which
     * would be built on every request and shipped to the browser.
     */
    protected int $maxOptionAliases = 31;

    protected bool | Closure $enableOptionAlias = true;

    public function isEnabledOptionAlias(): bool
    {
        return (bool) $this->evaluate($this->enableOptionAlias);
    }

    public function enableOptionAlias(bool | Closure $condition = true): static
    {
        $this->enableOptionAlias = $condition;

        return $this;
    }

    public function maxOptionAliases(int $count): static
    {
        $this->maxOptionAliases = max(0, $count);

        return $this;
    }

    /**
     * @return array<int, string>
     */
    public function getOptionAliases(string $label): array
    {
        $words = preg_split('/[\s\/]+/', $label, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $wordCount = count($words);

        // A single word is already matched by the label itself.
        if ($wordCount < 2) {
            return [];
        }

        $aliases = [];
        $limit = 1 << min($wordCount, 62);

        for ($mask = 1; $mask < $limit; $mask++) {
            $combination = [];

            for ($i = 0; $i < $wordCount; $i++) {
                if ($mask & (1 << $i)) {
                    $combination[] = $words[$i];
                }
            }

            $aliases[implode(' ', $combination)] = true;

            if (count($aliases) >= $this->maxOptionAliases) {
                break;
            }
        }

        return array_keys($aliases);
    }
}
