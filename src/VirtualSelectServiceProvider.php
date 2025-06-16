<?php

namespace Alva\FilamentVirtualSelect;

use Filament\Support\Assets\AlpineComponent;
use Filament\Support\Assets\Asset;
use Filament\Support\Assets\Css;
use Filament\Support\Facades\FilamentAsset;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class VirtualSelectServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-virtual-select';

    public static string $viewNamespace = 'filament-virtual-select';

    public function registeringPackage()
    {

    }

    public function configurePackage(Package $package): void
    {
        $package
            ->name(static::$name);

        if (file_exists($package->basePath('/../resources/views'))) {
            $package->hasViews(static::$viewNamespace);
        }
    }

    public function packageBooted(): void
    {
        // Asset Registration
        FilamentAsset::register(
            $this->getAssets(),
            $this->getAssetPackageName()
        );
    }

    public function packageRegistered(): void
    {
    }

    protected function getAssetPackageName(): ?string
    {
        return 'alva/filament-virtual-select';
    }

    /**
     * @return array<Asset>
     */
    protected function getAssets(): array
    {
        return [
            AlpineComponent::make('filament-virtual-select', __DIR__ . '/../resources/dist/filament-virtual-select.js'),
            Css::make('filament-virtual-select-styles', __DIR__ . '/../resources/dist/filament-virtual-select.css'),
        ];
    }
}
