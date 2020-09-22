<template>
  <gs-popover
    v-clickoutside="handleClickoutside"
    ref="cascaderPop"
    v-model="menuVisible"
    v-bind="popoverPropsComputed"
    width="auto"
  >
    <span
      slot="reference"
      :class="[
        {
          'is-opened': menuVisible,
          'is-disabled': disabled,
          'has-content': clearable && currentLabels && currentLabels.length
        }
      ]"
      :style="styleWidth"
      class="cascader-tree-select"
      @click="handleClick"
      @mouseenter="handleInputHover(true)"
      @mouseleave="handleInputHover(false)"
      @focus="handleInputHover(true)"
      @blur="handleInputHover(false)"
      @keydown="handleKeydown"
    >
    {{inputValue}}
      <gs-input
        ref="input"
        v-model="inputValue"
        :class="{
          'is-focus': menuVisible,
          'is-hover': inputHover && !disabled
        }"
        :readonly="!filterable"
        :placeholder="currentLabels.length ? undefined : placeholder"
        :validate-event="validateEvent"
        :disabled="disabled"
        :width="width"
        @input="debouncedInputChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <template slot="icon">
          <gs-icon
            v-if="clearable && currentLabels && currentLabels.length && !disabled"
            v-show="inputValue === ''"
            name="close-circle"
            mode="button"
            class="gs-input__icon gs-icon-close-circle cascader-tree-select__clearIcon"
            @click="clearValue"
          />
          <gs-icon
            :disabled="disabled"
            :class="{ 'is-reverse': menuVisible }"
            name="down"
            class="gs-input__icon"
          />
        </template>
      </gs-input>
      <span
        v-show="inputValue === ''"
        class="cascader-tree-select__label"
      >
        <template v-if="showAllLevels">
          <template v-for="(label, index) in currentLabels">
            {{ label }}
            <span
              v-if="index < currentLabels.length - 1"
              :key="index"
            > {{ separator }} </span>
          </template>
        </template>
        <template v-else>
          {{ currentLabels[currentLabels.length - 1] }}
        </template>
      </span>
    </span>
    <tree-menu
      ref="menu"
      v-model="value"
      :input-width="inputWidth"
      v-bind="menuProps"
      @update-popover="updatePopper"
      @pick="handlePick"
    />
  </gs-popover>
</template>
<script>
import Clickoutside from './clickoutside';
import emmiter from './emmiter';
import TreeMenu from './menu';

import {
  Input,
  Icon,
  Popover
} from '@gs-ui/gs-ui';

export default {
  name: 'CascaderTreeSelect',

  directives: { Clickoutside },

  mixins: [emmiter],

  components: {
    TreeMenu,
    [Input.name]: Input,
    [Icon.name]: Icon,
    [Popover.name]: Popover
  },

  provide() {
    return {
      cascader: this
    };
  },

  props: {
    props: {
      type: Object,
      default: () => ({})
    },
    popoverProps: {
      type: Object,
      default: () => ({})
    },
    treeProps: {
      type: Object,
      default: () => ({})
    },
    value: {
      type: Array,
      default() {
        return [];
      }
    },
    options: {
      type: Array,
      required: true,
      defualt() {
        return [];
      }
    },
    validateEvent: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    separator: {
      type: String,
      default: '/'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    changeOnSelect: {
      type: Boolean,
      default: false
    },
    showAllLevels: {
      type: Boolean,
      default: true
    },
    height: {
      type: Number,
      default: 200
    },
    width: {
      type: [String, Number]
    },
    defaultExpandedKeys: {
      type: Array,
      default: () => {
        return null;
      }
    },
    expandOnClickNode: {
      type: Boolean,
      default: false
    },
    renderContent: Function,
    filterable: {
      type: Boolean,
      default: false
    },
    debounce: {
      type: Number,
      default: 300
    },
    beforeFilter: {
      type: Function,
      default: () => () => {}
    },
    filterNodeMethod: {
      type: Function
    },
    noMatchTip: {
      type: String,
      default: '无匹配数据'
    },
    lazy: {
      type: Boolean,
      default: false
    },
    load: {
      type: Function
    }
  },

  data() {
    return {
      currentValue: this.value || [],
      menuVisible: false,
      isEmpty: false,
      inputWidth: 0,
      inputValue: '',
      timer: null,
      inputHover: false,
      preventOverflow: {
        enabled: false
      }
    };
  },

  computed: {
    labelKey() {
      return this.props.label || 'label';
    },

    valueKey() {
      return this.props.value || 'value';
    },

    childrenKey() {
      return this.props.children || 'children';
    },

    currentLabels() {
      let options = this.options;
      let labels = [];
      this.currentValue.forEach(value => {
        const targetOption = options && options.filter(option => option[this.valueKey] === value)[0];
        if (targetOption) {
          labels.push(targetOption[this.labelKey]);
          options = targetOption[this.childrenKey];
        }
      });
      return labels;
    },

    id() {
      return Math.floor(Math.random() * 10000);
    },

    menuProps() {
      return {
        height: this.height,
        props: this.curProps,
        treeProps: this.treePropsComputed,
        options: this.options,
        separator: this.separator,
        noMatchTip: this.noMatchTip,
        changeOnSelect: this.changeOnSelect,
        expandOnClickNode: this.expandOnClickNode,
        defaultExpandedKeys: this.defaultExpandedKeys
      };
    },

    curProps() {
      return Object.assign(
        {
          label: 'label',
          value: 'value',
          children: 'children',
          disabled: 'disabled',
          expandDisabled: 'expandDisabled',
          data: 'data',
          className: 'className'
        },
        this.props || {}
      );
    },

    popoverPropsComputed() {
      let { popoverProps = {}, disabled } = this;
      popoverProps.popperClass = (popoverProps.popperClass || '') + ' cascader-tree-select-popper';
      return Object.assign({
        placement: 'bottom-start',
        arrow: false,
        trigger: 'manual'
      }, popoverProps, {
        disabled
      });
    },

    treePropsComputed() {
      let { treeProps = {}, curProps } = this;
      return Object.assign({
        accordion: false
      }, treeProps, {
        showCheckbox: false,
        checkRelated: false,
        nodeKey: curProps.value,
        props: curProps,
        defaultCheckedKeys: this.value,
        filterNodeMethod: this.filterMethod,
        lazy: this.lazy,
        load: this.load
      });
    },

    filterMethod() {
      const defaultFilter = (val, data) => {
        if (!val) {
          return true;
        }
        return data[this.labelKey].includes(val);
      };

      return this.filterNodeMethod || defaultFilter;
    },

    styleWidth() {
      let width = this.width;
      if (width || 0) {
        return {
          width: typeof width === 'string' ? width : `${width}px`
        };
      }
      return {};
    }
  },

  watch: {
    value(value) {
      this.currentValue = value;
    },
    menuVisible(v) {
      this.$refs.input.$refs.input.setAttribute('aria-expanded', v);
      this.$emit('visible-change', v);
      if (v) {
        this.$refs.menu.updateScrollbar();
        this.inputWidth = this.$refs.input.$el.offsetWidth - 18;
        this.$refs.menu.value = this.currentValue.slice(0);
        // console.error('menu-visible', 'change');

        this.$emit('focus');
        if (this.validateEvent) {
          this.dispatch('GsFormItem', 'gs.form.focus', this.currentValue);
        }
      } else {
        this.$emit('blur');
        if (this.validateEvent) {
          this.dispatch('GsFormItem', 'gs.form.blur', this.currentValue);
        }
      }
    },
    currentLabels(value) {
      const inputLabel = this.showAllLevels ? value.join('/') : value[value.length - 1];
      this.$refs.input.$refs.input.setAttribute('value', inputLabel);
    }
  },

  mounted() {
  },

  methods: {
    handleInputHover(isHover) {
      this.inputHover = isHover;
    },

    handleFocus() {
      this.$emit('focus');
    },

    handleBlur() {
      this.$emit('blur');
    },

    handleKeydown(e) {
      const keyCode = e.keyCode;
      if (keyCode === 13) {
        this.handleClick();
      } else if (keyCode === 40) { // down
        this.menuVisible = true;
        e.stopPropagation();
        e.preventDefault();
      } else if (keyCode === 27 || keyCode === 9) { // esc tab
        this.inputValue = '';
        if (this.menuVisible) this.menuVisible = false;
      }
    },

    handleClickoutside() {
      this.menuVisible = false;
    },

    handleClick() {
      if (this.disabled) return;
      this.$refs.input.$refs.input.focus();
      if (this.filterable) {
        this.menuVisible = true;
        return;
      }
      this.menuVisible = !this.menuVisible;
    },

    clearValue(ev) {
      ev.stopPropagation();
      this.handlePick([], true);
    },

    handlePick(value, close = true) {
      this.currentValue = value;
      this.$emit('input', value);
      this.$emit('change', value);

      if (this.validateEvent) {
        this.dispatch('GsFormItem', 'gs.form.change', value);
      }

      if (this.filterable && this.inputValue !== '') {
        this.clearFilter();
      }

      if (close) {
        this.menuVisible = false;
      } else {
        this.updatePopper();
      }
    },

    clearFilter() {
      this.inputValue = '';
      this.handleInputChange();
    },

    updatePopper() {
      const popover = this.$refs.cascaderPop;
      popover && this.$nextTick(popover.updatePopover);
    },

    debouncedInputChange(val) {
      clearTimeout(this.timer);

      this.timer = setTimeout(() => {
        const before = this.beforeFilter(val);

        if (before && before.then) {
          before
            .then(() => {
              this.$nextTick(() => {
                this.handleInputChange(val);
              });
            });
        } else if (before !== false) {
          this.$nextTick(() => {
            this.handleInputChange(val);
          });
        }
      }, this.debounce);
    },

    handleInputChange(val) {
      if (!this.menuVisible) return;
      this.$refs.menu.doFilter(val);
    }
  }
};
</script>
