import Vue from 'vue';
import DemoBlock from '@components/demo-block';
import 'highlight.js/styles/color-brewer.css';
import '@gs-ui/elf/lib/style/github-markdown-css.css';
import '@components/demo-block/lib/style/index.css';

import CascaderTreeSelect from 'src/index';
import Demo from './demo.vue';
import './style.scss';

Vue.component('demo-block', DemoBlock);
// Vue.component('cascader-tree-select', CascaderTreeSelect);

Vue.use(CascaderTreeSelect);

new Vue({
  el: '#root',
  render(h) {
    return h(Demo);
  }
});
