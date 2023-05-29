/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { RuleObject } from 'antd/lib/form';
import { AxiosError } from 'axios';
import RichTextEditorPreviewer from 'components/common/rich-text-editor/RichTextEditorPreviewer';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import { delimiterRegex } from 'constants/regex.constants';
import { TagLabel } from 'generated/type/schema';
import i18next from 'i18next';
import { isEmpty, isUndefined, toLower } from 'lodash';
import { Bucket, EntityTags, TagOption } from 'Models';
import React from 'react';
import {
  getAllClassifications,
  getClassificationByName,
  getTags,
} from 'rest/tagAPI';
import { SettledStatus } from '../enums/axios.enum';
import { Classification } from '../generated/entity/classification/classification';
import { Tag } from '../generated/entity/classification/tag';
import { Column } from '../generated/entity/data/table';
import { Paging } from '../generated/type/paging';
import { LabelType, State, TagSource } from '../generated/type/tagLabel';
import { isUrlFriendlyName } from './CommonUtils';
import { fetchGlossaryTerms, getGlossaryTermlist } from './GlossaryUtils';

export const getClassifications = async (
  fields?: Array<string> | string,
  callGetClassificationByName = true
) => {
  try {
    const listOfClassifications: Array<Classification> = [];
    const classifications = await getAllClassifications(fields, 1000);
    const classificationList = classifications.data.map(
      (category: Classification) => {
        return {
          name: category.name,
          description: category.description,
        } as Classification;
      }
    );
    if (classificationList.length && callGetClassificationByName) {
      const promiseArr = classificationList.map((category: Classification) =>
        getClassificationByName(category.name, fields)
      );

      const categories = await Promise.allSettled(promiseArr);

      categories.forEach((category) => {
        if (category.status === SettledStatus.FULFILLED) {
          listOfClassifications.push(category.value);
        }
      });
    }

    return Promise.resolve({ data: listOfClassifications });
  } catch (error) {
    return Promise.reject({ data: (error as AxiosError).response });
  }
};

/**
 * This method returns all the tags present in the system
 * @returns tags: Tag[]
 */
export const getAllTagsForOptions = async () => {
  let tags: Tag[] = [];
  try {
    const { data } = await getTags({ limit: 1000 });

    tags = data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  return tags;
};

/**
 * Return tags based on classifications
 * @param classifications -- Parent for tags
 * @param paging
 * @returns Tag[]
 */
export const getTaglist = async (
  classifications: Array<Classification> = [],
  paging?: Paging
) => {
  try {
    const tags: Tag[] = [];

    const tagsListPromise = classifications.map((classification) =>
      getTags({
        arrQueryFields: '',
        parent: classification.name,
        after: paging?.after,
        before: paging?.before,
        limit: 1000,
      })
    );

    return await Promise.allSettled(tagsListPromise)
      .then((tagList) => {
        tagList.forEach((tag) => {
          if (tag.status === SettledStatus.FULFILLED) {
            tags.push(...tag.value.data);
          }
        });

        return tags.map((tag) => tag.fullyQualifiedName || tag.name);
      })
      .catch((error) => {
        return Promise.reject({ data: (error as AxiosError).response });
      });
  } catch (error) {
    return Promise.reject({ data: (error as AxiosError).response });
  }
};

export const getTableTags = (
  columns: Array<Partial<Column>>
): Array<EntityTags> => {
  const flag: { [x: string]: boolean } = {};
  const uniqueTags: Array<EntityTags> = [];
  const tags = columns
    .map((column) => column.tags || [])
    .reduce((prev, curr) => prev.concat(curr), [])
    .map((tag) => tag);

  tags.forEach((elem) => {
    if (!flag[elem.tagFQN]) {
      flag[elem.tagFQN] = true;
      uniqueTags.push(elem);
    }
  });

  return uniqueTags;
};

export const getTagOptionsFromFQN = (
  tagFQNs: Array<string>
): Array<TagOption> => {
  return tagFQNs.map((tag) => {
    return { fqn: tag, source: 'Classification' };
  });
};

export const getTagOptions = (tags: Array<string>): Array<EntityTags> => {
  return tags.map((tag) => {
    return {
      labelType: LabelType.Manual,
      state: State.Confirmed,
      tagFQN: tag,
      source: TagSource.Classification,
    };
  });
};

// Will add a label of value in the data object without it's FQN
export const getTagsWithLabel = (tags: Array<Bucket>) => {
  return tags.map((tag) => {
    const containQuotes = tag.key.split('"')[1];

    return {
      ...tag,
      label: isEmpty(containQuotes) ? tag.key.split('.').pop() : containQuotes,
    };
  });
};

//  Will return tag with ellipses if it exceeds the limit
export const getTagDisplay = (tag: string) => {
  const tagLevelsArray = tag.split(FQN_SEPARATOR_CHAR);

  if (tagLevelsArray.length > 3) {
    return `${tagLevelsArray[0]}...${tagLevelsArray
      .slice(-2)
      .join(FQN_SEPARATOR_CHAR)}`;
  }

  return tag;
};

// will return only the aname
export const getTagSimpleDisplay = (tag: string) => {
  const tagLevelsArray = tag.split(FQN_SEPARATOR_CHAR);

  return tagLevelsArray[tagLevelsArray.length - 1];
};

export const getTagDisplayColorClass = (tag: TagLabel) => {
  if (tag?.source === TagSource.Glossary) {
    return 'tag-glossary';
  } else {
    return 'tag-classification';
  }
};

export const getDuplicatedTags = (tags: TagLabel[]) => {
  const duplicates: string[] = [];
  const seen: Record<string, boolean> = {};
  for (const tag of tags) {
    const tagSimpleName = getTagSimpleDisplay(tag.tagFQN);
    if (seen[tagSimpleName]) {
      duplicates.push(tag.tagFQN);
    } else {
      seen[tagSimpleName] = true;
    }
  }

  return duplicates;
};

export const fetchTagsAndGlossaryTerms = async () => {
  const responses = await Promise.allSettled([
    getAllTagsForOptions(),
    fetchGlossaryTerms(),
  ]);

  let tagsAndTerms: TagOption[] = [];
  if (responses[0].status === SettledStatus.FULFILLED && responses[0].value) {
    tagsAndTerms = responses[0].value.map((tag) => {
      return {
        fqn: tag.fullyQualifiedName ?? tag.name,
        source: 'Classification',
      };
    });
  }
  if (
    responses[1].status === SettledStatus.FULFILLED &&
    responses[1].value &&
    responses[1].value.length > 0
  ) {
    const glossaryTerms: TagOption[] = getGlossaryTermlist(
      responses[1].value
    ).map((tag) => {
      return { fqn: tag, source: 'Glossary' };
    });
    tagsAndTerms = [...tagsAndTerms, ...glossaryTerms];
  }

  return tagsAndTerms;
};

/**
 *
 * @param isExtending For extending/adding more validation to field
 * @param data For validating if value already exist in the list
 * @returns If validation failed throws an error else resolve
 */

export const tagsNameValidator =
  (isExtending: boolean, data?: Classification[]) =>
  async (_: RuleObject, value: string) => {
    if (delimiterRegex.test(value)) {
      return Promise.reject(
        i18next.t('message.entity-delimiters-not-allowed', {
          entity: i18next.t('label.name'),
        })
      );
    }
    if (isExtending) {
      if (!isUrlFriendlyName(value)) {
        return Promise.reject(
          i18next.t('message.special-character-not-allowed')
        );
      } else if (
        !isUndefined(
          data?.find((item) => toLower(item.name) === toLower(value))
        )
      ) {
        return Promise.reject(
          i18next.t('message.entity-already-exists', {
            entity: i18next.t('label.name'),
          })
        );
      }
    }

    return Promise.resolve();
  };

export const getTagTooltip = (fqn: string, description?: string) => (
  <div className="text-left p-xss">
    <div className="m-b-xs">
      <RichTextEditorPreviewer
        enableSeeMoreVariant={false}
        markdown={`**${fqn}**\n${description ?? ''}`}
        textVariant="white"
      />
    </div>
  </div>
);
