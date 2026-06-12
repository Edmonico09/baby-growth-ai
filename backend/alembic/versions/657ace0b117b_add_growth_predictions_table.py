"""add_growth_predictions_table

Revision ID: 657ace0b117b
Revises: 4709a5b6f82d
Create Date: 2026-06-12 17:03:53.824012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '657ace0b117b'
down_revision: Union[str, Sequence[str], None] = '4709a5b6f82d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('growth_predictions',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('child_id', sa.String(), nullable=False),
    sa.Column('prediction_date', sa.Date(), nullable=False),
    sa.Column('predicted_weight_1_month', sa.Float(), nullable=True),
    sa.Column('predicted_weight_3_months', sa.Float(), nullable=True),
    sa.Column('predicted_height_1_month', sa.Float(), nullable=True),
    sa.Column('predicted_height_3_months', sa.Float(), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['child_id'], ['children.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_growth_predictions_child_id'), 'growth_predictions', ['child_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_growth_predictions_child_id'), table_name='growth_predictions')
    op.drop_table('growth_predictions')
