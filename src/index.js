import CascaderTreeSelect from './cascader-tree-select';
import CascaderTreePanel from './cascader-tree-panel';
import CollapseTransition from '@gs-ui/gs-ui/lib/_utils/transition';

import './style.scss';

/* istanbul ignore next */
CascaderTreeSelect.install = function (Vue) {
  Vue.component(CollapseTransition.name, CollapseTransition);
  Vue.component(CascaderTreeSelect.name, CascaderTreeSelect);
  Vue.component(CascaderTreePanel.name, CascaderTreePanel);
};

CascaderTreeSelect.Panel = CascaderTreePanel;

export default CascaderTreeSelect;
