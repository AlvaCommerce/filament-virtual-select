import 'virtual-select-plugin/dist/virtual-select.min.js';
import 'tooltip-plugin/dist/tooltip.min.js'

export default function virtualSelectFormComponent({
   isHtmlAllowed,
   getOptionLabelUsing,
   getOptionLabelsUsing,
   getOptionsUsing,
   getSearchResultsUsing,
   isAutofocused,
   isMultiple,
   isSearchable,
   hasDynamicOptions,
   hasDynamicSearchResults,
   livewireId,
   loadingMessage,
   maxItems,
   noOptionsMessage,
   noSearchResultsMessage,
   options,
   visibleOptionsCount,
   placeholder,
   position,
   searchDebounce,
   searchingMessage,
   searchPrompt,
   searchableOptionFields,
   state,
   statePath,
   allOptionsSelectedText,
   optionsSelectedText,
   optionSelectedText,
   hideClearButton,
   selectAllText,
   clearAllText,
}) {
    return {
        select: null,

        isStateBeingUpdated: false,

        hasDropdownActions: false,

        windowEventListeners: [],

        state,

        init: async function () {
            new VirtualSelect({
                ele: this.$refs.input,
                allowHTML: isHtmlAllowed,
                multiple: isMultiple,
                search: isSearchable,
                searchGroup: isSearchable,
                autofocus: isAutofocused,
                placeholder: placeholder,
                position: position ?? 'auto',
                searchPlaceholderText: searchPrompt,
                noOptionsText: noOptionsMessage,
                noSearchResultsText: noSearchResultsMessage,
                searchFields: searchableOptionFields ?? ['label'],
                optionsCount: visibleOptionsCount,
                maxValues: maxItems ?? 0,
                loadingText: loadingMessage,
                allOptionsSelectedText: allOptionsSelectedText,
                optionsSelectedText: optionsSelectedText,
                optionSelectedText: optionSelectedText,
                hideClearButton: true, // Hide from main input
                showDropboxAsPopup: false,
                popupDropboxBreakpoint: '0px',
                zIndex: 99
            });

            this.select = this.$refs.input;

            this.preventHoverScroll();

            // Add custom buttons to dropdown if multiple selection is enabled
            if (isMultiple) {
                this.addDropdownActions(hideClearButton, selectAllText, clearAllText);

                this.addWindowEventListener('filament-virtual-select--selectAll-' + livewireId, () => this.toggleSelectAll(true));
                this.addWindowEventListener('filament-virtual-select--removeAll-' + livewireId, () => this.toggleSelectAll(false));
            }

            this.select.addEventListener('change', () => {
                if (this.isStateBeingUpdated) {
                    return
                }

                this.isStateBeingUpdated = true
                this.state = this.getSelectedValues()

                this.$nextTick(() => (this.isStateBeingUpdated = false))
            })

            if (hasDynamicOptions) {
                this.select.addEventListener('beforeOpen', async () => {
                    await this.refreshChoices()
                })
            }

            // Add actions on dropdown open for multiple select
            if (isMultiple) {
                this.select.addEventListener('beforeOpen', () => {
                    this.addDropdownActions(hideClearButton, selectAllText, clearAllText);
                });
            }

            if (hasDynamicSearchResults) {
                this.select.addEventListener('search', async (event) => {
                    let search = event.detail.value?.trim()

                    // `true` keeps the current selection (and its label) while the
                    // placeholder row is shown, and skips the plugin's own `reset()`.
                    this.select.setOptions([
                        {
                            label: [null, undefined, ''].includes(search)
                                ? loadingMessage
                                : searchingMessage,
                            value: '',
                            disabled: true,
                        },
                    ], true)

                    this.select.virtualSelect?.updatePosition()
                })

                this.select.addEventListener(
                    'search',
                    Alpine.debounce(async (event) => {
                        await this.refreshChoices({
                            search: event.detail.value?.trim(),
                        })
                    }, searchDebounce),
                )
            }

            if (!isMultiple) {
                this.addWindowEventListener(
                    'filament-forms::select.refreshSelectedOptionLabel',
                    async (event) => {
                        if (event.detail.livewireId !== livewireId) {
                            return
                        }

                        if (event.detail.statePath !== statePath) {
                            return
                        }

                        await this.refreshChoices({
                            withInitialOptions: false,
                        })
                    },
                )
            }

            this.$watch('state', async () => {
                if (!this.select) {
                    return
                }

                if (this.isStateBeingUpdated) {
                    return
                }

                // Livewire echoes the state back after every round trip. Rebuilding the
                // option list when it already matches only costs a request and a reflow.
                if (this.isStateInSyncWithSelection()) {
                    return
                }

                await this.refreshChoices({
                    withInitialOptions: !hasDynamicOptions,
                })
            })

            // Last, because it may await a round trip for labels of options that are
            // not in the initial set — the listeners above must already be in place.
            await this.refreshChoices({ withInitialOptions: true })
        },

        destroy: function () {
            this.windowEventListeners.forEach(([event, listener]) =>
                window.removeEventListener(event, listener),
            )

            this.windowEventListeners = []

            this.select?.destroy?.()
            this.select = null;
        },

        /**
         * On mouseover the plugin focuses the hovered option and scrolls it into view.
         * Both fight its own virtual scrolling: `focus()` scrolls the option list, that
         * scroll re-renders the option window, and the list creeps upwards under a
         * moving pointer — while every `focus()` forces a layout. Keyboard navigation
         * still scrolls the focused option into view.
         */
        preventHoverScroll: function () {
            const instance = this.select?.virtualSelect

            if (!instance) {
                return
            }

            const focusOption = instance.focusOption
            const moveFocusedOptionToView = instance.moveFocusedOptionToView
            const toggleOptionFocusedState = instance.toggleOptionFocusedState

            instance.toggleOptionFocusedState = function ($option, isFocused) {
                if (!$option) {
                    return toggleOptionFocusedState.call(this, $option, isFocused)
                }

                const focus = $option.focus
                $option.focus = (options) => focus.call($option, { ...options, preventScroll: true })

                try {
                    return toggleOptionFocusedState.call(this, $option, isFocused)
                } finally {
                    delete $option.focus
                }
            }

            instance.focusOption = function (config = {}) {
                // `$option` is only passed by the mouseover handler.
                if (!config.$option) {
                    return focusOption.call(this, config)
                }

                this.moveFocusedOptionToView = () => {}

                try {
                    return focusOption.call(this, config)
                } finally {
                    this.moveFocusedOptionToView = moveFocusedOptionToView
                }
            }
        },

        /**
         * Tracks the listener so it can be detached when the component is torn down,
         * otherwise every modal open leaks a listener bound to a dead component.
         */
        addWindowEventListener: function (event, listener) {
            this.windowEventListeners.push([event, listener])

            window.addEventListener(event, listener)
        },

        getSelectedValues: function () {
            const selectedOptions = this.select.getSelectedOptions() ?? []

            const values = (Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions])
                .map((option) => option?.value)
                .filter((value) => value !== '' && value !== null && value !== undefined)

            return isMultiple ? values : (values[0] ?? null)
        },

        isStateInSyncWithSelection: function () {
            const selectedValues = this.normalizeForComparison(this.getSelectedValues())
            const stateValues = this.normalizeForComparison(this.formatState(this.state))

            return selectedValues.length === stateValues.length &&
                selectedValues.every((value, index) => value === stateValues[index])
        },

        normalizeForComparison: function (value) {
            return [value ?? []]
                .flat()
                .filter((item) => ![null, undefined, ''].includes(item))
                .map((item) => item.toString())
                .sort()
        },

        addDropdownActions: function (hideClearButton, selectAllText, clearAllText) {
            if (this.hasDropdownActions) {
                return;
            }

            this.$nextTick(() => {
                const dropbox = this.$refs.input.parentElement.querySelector('.vscomp-dropbox');
                if (!dropbox) return;

                if (dropbox.querySelector('.vscomp-custom-actions')) return;

                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'vscomp-custom-actions';

                const selectAllBtn = document.createElement('button');
                selectAllBtn.type = 'button';
                selectAllBtn.className = 'vscomp-custom-action-btn vscomp-select-all-btn';
                selectAllBtn.textContent = selectAllText;
                selectAllBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    !this.select.isAllSelected() && this.toggleSelectAll(true);
                });

                const clearAllBtn = document.createElement('button');
                clearAllBtn.type = 'button';
                clearAllBtn.className = 'vscomp-custom-action-btn vscomp-clear-all-btn';
                clearAllBtn.textContent = clearAllText;
                clearAllBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.clearAll();
                });

                actionsContainer.appendChild(selectAllBtn);
                if (!hideClearButton) {
                    actionsContainer.appendChild(clearAllBtn);
                }


                const dropboxSearchWrapper = dropbox.querySelector('.vscomp-search-wrapper');
                if (dropboxSearchWrapper) {
                    dropboxSearchWrapper.appendChild(actionsContainer);

                    this.hasDropdownActions = true;
                }
            });
        },

        toggleSelectAll: function (state) {
            this.select.toggleSelectAll(state);
        },

        clearAll: function () {
            this.select.reset();
        },

        refreshChoices: async function (config = {}) {
            const choices = await this.getChoices(config)

            if (!this.select) {
                return
            }

            this.setChoices(choices)
        },

        /**
         * `setOptions()` without the second argument makes the plugin call `reset()`,
         * which wipes the selection and dispatches a `change` event — on a `live()`
         * field that means an extra round trip plus a visible jump. Passing `true`
         * keeps the selection, and the silent `setValue()` re-applies the current
         * state without emitting another `change`.
         */
        setChoices: function (choices) {
            const state = this.formatState(this.state)

            this.isStateBeingUpdated = true

            this.select.setOptions(choices, true)
            this.select.setValue(state ?? null, true)

            // The dropbox is anchored once, when it opens, and the plugin never
            // re-anchors it (`disableUpdatePosition` is on for an inline dropbox).
            // Options fetched on `beforeOpen` land after that, so a box that was
            // measured while still empty keeps the offset of an empty box and ends
            // up covering the field. Re-anchor it against its real height; the
            // plugin's own method is a no-op while the dropdown is closed.
            this.select.virtualSelect?.updatePosition()

            this.$nextTick(() => (this.isStateBeingUpdated = false))
        },

        getChoices: async function (config = {}) {
            const existingOptions = await this.getExistingOptions(config);

            return existingOptions.concat(
                await this.getMissingOptions(existingOptions),
            )
        },

        getExistingOptions: async function ({ search, withInitialOptions }) {
            if (withInitialOptions) {
                return options
            }

            let results = []

            if (search !== '' && search !== null && search !== undefined) {
                results = await getSearchResultsUsing(search)
            } else {
                results = await getOptionsUsing()
            }

            return results.map((result) => {
                if (result.options) {
                    result.options = result.options.map((groupedOption) => {
                        groupedOption.selected = Array.isArray(this.state)
                            ? this.state.includes(groupedOption.value)
                            : this.state === groupedOption.value

                        return groupedOption
                    })

                    return result
                }

                result.selected = Array.isArray(this.state)
                    ? this.state.includes(result.value)
                    : this.state === result.value

                return result
            })
        },


        formatState: function (state) {
            if (isMultiple) {
                return (state ?? []).map((item) => item?.toString())
            }

            return state?.toString()
        },

        getMissingOptions: async function (existingOptions) {
            let state = this.formatState(this.state)

            if ([null, undefined, ''].includes(state) || (Array.isArray(state) && !state.length)) {
                return []
            }

            const existingOptionValues = new Set()

            existingOptions.forEach((existingOption) => {
                if (existingOption.options) {
                    existingOption.options.forEach((groupedExistingOption) =>
                        existingOptionValues.add(groupedExistingOption.value),
                    )

                    return
                }

                existingOptionValues.add(existingOption.value)
            })

            if (isMultiple) {
                if (state.every((value) => existingOptionValues.has(value))) {
                    return []
                }

                return (await getOptionLabelsUsing())
                    .filter((option) => !existingOptionValues.has(option.value))
                    .map((option) => {
                        option.selected = true

                        return option
                    })
            }

            if (existingOptionValues.has(state)) {
                return []
            }

            return [
                {
                    label: await getOptionLabelUsing(),
                    value: state,
                    selected: true,
                },
            ]
        },
    }
}
