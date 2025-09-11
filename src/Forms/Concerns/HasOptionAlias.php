<?php

namespace Alva\FilamentVirtualSelect\Forms\Concerns;

trait HasOptionAlias
{
    public bool $enableOptionAlias = true;

    public function isEnabledOptionAlias(): bool
    {
        return $this->enableOptionAlias;
    }

    public function enableOptionAlias(bool $condition = true): static
    {
        $this->enableOptionAlias = $condition;

        return $this;
    }

    public function getOptionAliases(string $label): array
    {
        $words = preg_split('/[\s\/]+/', $label, -1, PREG_SPLIT_NO_EMPTY);
        $aliases = [];
        $wordCount = count($words);

        // Generate all possible combinations of words
        for ($mask = 1; $mask < (1 << $wordCount); $mask++) {
            $combination = [];
            for ($i = 0; $i < $wordCount; $i++) {
                if ($mask & (1 << $i)) {
                    $combination[] = $words[$i];
                }
            }
            $aliases[] = implode(' ', $combination);
        }

        return array_unique($aliases);
    }
}
