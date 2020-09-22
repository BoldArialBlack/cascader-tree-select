<template>
  <div
    class="cascader-tree-menu"
  >
    <gs-scrollbar
      ref="scrollbar"
      :style="{'min-width': inputWidth + 'px'}"
      :wrap-style="{ 'max-height': height !== 0 ? height + 'px' : 'unset'}"
      noresize
    >
      <gs-tree
        ref="tree"
        :class="{'is-expand-on-click': expandOnClickNode}"
        :data="options"
        :props="props"
        :default-expanded-keys="defaultExpandedKeys || activeValues"
        :expand-on-click-node="expandOnClickNode"
        :render-content="renderContent"
        v-bind="treeProps"
        disable-node
        hover-highlight
        expand-on-filter-match
        @check-change="handleCheckChange"
        @current-change="handleCurrentChange"
        @node-toggle="handleNodeToggle"
        @node-click="handleOptionClick"
      />
      <div
        v-show="isEmpty"
        class="no-match-tip"
      >
        {{ noMatchTip }}
      </div>
    </gs-scrollbar>
  </div>
</template>
<script>
import {
  Scrollbar,
  Tree
} from '@gs-ui/gs-ui';
/* import CollapseTransition from '@gs-ui/gs-ui/components/_utils/plugins/collapse-transition'; */

export function findChild(node, fn, deep = true) {
  (node.childNodes || node.children || []).forEach(child => {
    typeof fn === 'function' && fn(child);
    deep && findChild(child, fn, deep);
  });
}

export function findParent(node, fn, deep = true) {
  const {
    parent
  } = node.$node;
  if (parent) {
    typeof fn === 'function' && fn(parent);
    deep && findParent(parent, fn, deep);
  }
}

export default {
  components: {
    /* [CollapseTransition.name]: CollapseTransition, */
    [Scrollbar.name]: Scrollbar,
    [Tree.name]: Tree
  },

  inject: ['cascader'],

  props: {
    props: {
      type: Object,
      default: () => ({})
    },
    treeProps: {
      type: Object,
      defualt: () => ({})
    },
    options: {
      type: Array,
      defualt() {
        return [];
      }
    },
    separator: {
      type: String,
      default: '/'
    },
    changeOnSelect: {
      type: Boolean,
      default: false
    },
    expandOnClickNode: {
      type: Boolean,
      default: false
    },
    defaultExpandedKeys: {
      type: Array,
      default: () => {
        return [];
      }
    },
    height: {
      type: Number,
      default: 200
    },
    inputWidth: {
      type: Number,
      default: 0
    },
    filterNodeMethod: {
      type: Function
    },
    noMatchTip: {
      type: String,
      default: '无匹配数据'
    }
  },

  data() {
    return {
      data: [],
      node: {},
      cacheKey: '',
      value: [],
      activeValues: [],
      isEmpty: false
    };
  },

  computed: {
    labelKey() {
      return this.props.label;
    },
    valueKey() {
      return this.props.value;
    },
    disabledKey() {
      return this.props.disabled;
    },
    expandDisabledKey() {
      return this.props.expandDisabled;
    },
    lazy() {
      return this.treeProps.lazy || false;
    }
  },

  watch: {
    value: {
      handler(value) {
        this.activeValues = value;
        this.$nextTick(() => {
          this.refresh();
        });
      }
    }
  },

  methods: {
    updateScrollbar() {
      this.$nextTick(() => {
        this.$refs.scrollbar.update();
      });
    },

    doFilter(val) {
      this.$refs.tree.filter(val);

      const { nodesMap } = this.$refs.tree.treeStore;
      let arr = Object.keys(nodesMap).map((key) => nodesMap[key]);
      this.isEmpty = !arr.some(node => node.$node.filtered);
    },

    handleOptionClick(node, ev) {
      const {
        lazy,
        expandDisabledKey,
        changeOnSelect,
        expandOnClickNode
      } = this;

      if (ev &&
        ev.target.classList.contains('gs-tree-node-expand-icon') &&
        (!node.$node.isLeaf ||
          (lazy && !node.$node.loaded))) {
        setTimeout(this.updateScrollbar, 400);
        return;
      }

      if (this.isIgnore(node)) return;

      this.cascader.$emit('node-click', node, ev);

      if (this.cacheKey === node.$node.key) {
        return;
      }
      this.cacheKey = node.$node.key;

      this.node = node;
      node.node = this.parseData();

      if (changeOnSelect ||
        (!changeOnSelect &&
          (node.$node.isLeaf && (!lazy || (node.$node.loaded))))) {
        if (expandOnClickNode && (!node.$node.isLeaf || !node.$node.loaded) && !node.data[expandDisabledKey]) {
          this.$emit('pick', node.node.values.reverse(), false);
          this.activeValues = node.node.values.reverse();
          this.$nextTick(() => {
            this.refresh();
          });
          return;
        }
        this.$emit('pick', node.node.values.reverse());
        // this.activeValues = node.node.values;
      }
    },

    isIgnore(node) {
      const {
        disabledKey,
        expandDisabledKey
      } = this;

      let isParentExpandDisabled = false;
      findParent(node, parent => {
        if (parent.data[expandDisabledKey]) {
          isParentExpandDisabled = true;
          return;
        }
      });

      if (isParentExpandDisabled) {
        node.$node.isActive = false;
        return true;
      }

      node.disabled = node.data[disabledKey];
      if (node.disabled) return true;

      return false;
    },

    parseData() {
      const [labels, values] = [[], []];
      const {labelKey, valueKey, node, separator} = this;
      if (!node.data) {
        return;
      }
      values.push(node.data[valueKey]);
      labels.push(node.data[labelKey]);
      findParent(this.node, parent => {
        values.push(parent.data[valueKey]);
        labels.push(parent.data[labelKey]);
      });
      const _node = {
        values: values,
        allLabel: labels.reverse().join(separator),
        labels: labels.reverse()
      };
      this.updateScrollbar();
      return _node;
    },

    refresh() {
      this.toggleCurrentActive(this.activeValues);
      // console.error(this.$refs.tree);
    },

    toggleCurrentActive(keys) {
      const { expandDisabledKey } = this;
      this.$refs.tree.treeStore.tree.forEach(node => {
        findChild(node, child => {
          if (node.data[expandDisabledKey]) {
            node.$node.isExpand = false;
          }
          child.$node.isActive = child.$node.key === keys[keys.length - 1];
          child.$node.checked = (keys.indexOf(child.$node.key) !== -1);
        });
        if (node.data[expandDisabledKey]) {
          node.$node.isExpand = false;
        }
        node.$node.isActive = node.$node.key === keys[keys.length - 1];
        node.$node.checked = (keys.indexOf(node.$node.key) !== -1);
      });
    },

    renderContent(h, {node, data}) {
      const { labelKey } = this;
      let handleContentClick = (ev) => {
        this.cascader.$emit('content-click', node, ev);
      };

      return (
        this.cascader.renderContent
          ? this.cascader.renderContent(this.cascader, h, {node, data})
          : (this.treeProps.showTips
            ? (<span
              class={'is-ellipsis' + (node.$node.checked ? ' is-checked' : '')}
              title={node.data[labelKey]}
              on-click={handleContentClick}
            >
              { node.data[labelKey] }
            </span>)
            : <span class={'is-ellipsis' + (node.$node.checked ? ' is-checked' : '')} on-click={handleContentClick}>{ node.data[labelKey] }</span>)
      );
    },

    handleCheckChange(node, checked, indeterminate) {
      this.cascader.$emit('check-change', node, checked, indeterminate);
    },

    handleCurrentChange(node, checked) {
      this.cascader.$emit('current-change', node, checked);
    },

    handleNodeToggle(node, expanded) {
      this.cascader.$emit('node-toggle', node, expanded);
    }
  }
};
</script>
